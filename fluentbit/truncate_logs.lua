--
-- Lua filter for Fluent Bit to truncate SQL parameter lists in error logs
-- and escape control characters to ensure valid JSON for New Relic.
--
-- This filter detects and truncates SQL IN clauses with many parameters,
-- replacing patterns like "IN ((%(param_1_1)s), (%(param_1_2)s), ...)"
-- with "IN (/* N parameters truncated */ ...)"
--

local MAX_FIELD_LENGTH = 3000

--
-- Escape control characters that break JSON parsing.
-- Replaces literal newlines, carriage returns, and tabs with escaped versions.
--
local function escape_control_chars(str)
    if not str or type(str) ~= "string" then
        return str
    end
    -- Replace control characters with their escaped equivalents
    local result = str
    result = string.gsub(result, "\n", "\\n")
    result = string.gsub(result, "\r", "\\r")
    result = string.gsub(result, "\t", "\\t")
    return result
end

local MIN_PARAMS_FOR_TRUNCATION = 1

-- Fields that may contain SQL errors
local FIELDS_TO_CHECK = {
    "exc_text",
    "exc_info",
    "exc_info_short",
    "message",
    "formatted_msg",
    "msg",
    "stack_info",
    "log"
}

local function count_pattern(str, pattern)
    local count = 0
    local start = 1
    while true do
        local pos = string.find(str, pattern, start, true)  -- plain text search
        if not pos then break end
        count = count + 1
        start = pos + 1
    end
    return count
end

local function truncate_sql_params(str)
    if not str or type(str) ~= "string" then
        return str
    end

    local param_count = count_pattern(str, "%(param_")
    if param_count < MIN_PARAMS_FOR_TRUNCATION then
        return str
    end

    local result = str
    local search_start = 1

    while true do
        -- Find "IN (" or "in (" (case insensitive manual check)
        local in_pos = nil
        local lower_result = string.lower(result)

        -- Search for "in (" or "in  (" etc
        local i = search_start
        while i <= #result - 3 do
            if string.sub(lower_result, i, i+1) == "in" then
                -- Check if followed by whitespace and (
                local j = i + 2
                while j <= #result and string.sub(result, j, j) == " " do
                    j = j + 1
                end
                if j <= #result and string.sub(result, j, j) == "(" then
                    in_pos = i
                    break
                end
            end
            i = i + 1
        end

        if not in_pos then
            break
        end

        local paren_start = string.find(result, "(", in_pos, true)
        if not paren_start then
            search_start = in_pos + 2
            break
        end

        local depth = 1
        local pos = paren_start + 1
        while pos <= #result and depth > 0 do
            local char = string.sub(result, pos, pos)
            if char == "(" then
                depth = depth + 1
            elseif char == ")" then
                depth = depth - 1
            end
            pos = pos + 1
        end

        if depth == 0 then
            local in_clause = string.sub(result, in_pos, pos - 1)
            local clause_param_count = count_pattern(in_clause, "%(param_")

            if clause_param_count >= MIN_PARAMS_FOR_TRUNCATION then
                -- Replace this IN clause with truncated version
                local replacement = "IN (/* " .. clause_param_count .. " parameters truncated */ ...)"
                result = string.sub(result, 1, in_pos - 1) .. replacement .. string.sub(result, pos)
                search_start = in_pos + #replacement
            else
                search_start = pos
            end
        else
            -- No matching paren found, move past this IN
            search_start = paren_start + 1
        end
    end

    return result
end

--
-- Truncate SQL parameter lists in a string field, then apply length limit,
-- and escape control characters to ensure valid JSON.
--
local function truncate_field(value)
    if not value or type(value) ~= "string" then
        return value, false
    end

    local truncated = value

    -- First: truncate SQL IN clauses if params are found
    local param_count = count_pattern(value, "%(param_")
    if param_count >= MIN_PARAMS_FOR_TRUNCATION then
        truncated = truncate_sql_params(value)
    end

    -- Then: always apply max field length limit to all logs
    if #truncated > MAX_FIELD_LENGTH then
        local original_length = #value
        truncated = string.sub(truncated, 1, MAX_FIELD_LENGTH) ..
                    "... [TRUNCATED - original length: " .. original_length .. "]"
    end

    -- Finally: escape control characters to ensure valid JSON for New Relic
    truncated = escape_control_chars(truncated)

    return truncated, (truncated ~= value)
end

--
-- Process a field value, handling both strings and arrays of strings.
--
local function process_field(value)
    if not value then
        return value, false
    end

    -- Handle string fields directly
    if type(value) == "string" then
        return truncate_field(value)
    end

    -- Handle array fields (like exc_info which is a list)
    if type(value) == "table" then
        local array_modified = false
        for i, item in ipairs(value) do
            if type(item) == "string" then
                local new_item, was_modified = truncate_field(item)
                if was_modified then
                    value[i] = new_item
                    array_modified = true
                end
            end
        end
        return value, array_modified
    end

    return value, false
end

--
-- Main filter function called by Fluent Bit for each log record.
--
function truncate_large_fields(tag, timestamp, record)
    local modified = false

    for _, field in ipairs(FIELDS_TO_CHECK) do
        if record[field] then
            local new_value, was_modified = process_field(record[field])
            if was_modified then
                record[field] = new_value
                modified = true
            end
        end
    end

    if modified then
        return 2, timestamp, record
    end
    return 0, timestamp, record
end
