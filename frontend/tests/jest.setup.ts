import "@testing-library/jest-dom";

import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

process.env.apiUrl = "http://localhost";
