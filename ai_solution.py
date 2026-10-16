```javascript
import React, { useState, useEffect } from 'react';
import { Table, Pagination } from 'react-components';

const SavedSearchQueries = () => {
  const [savedSearches, setSavedSearches] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await API.get('/api/saved-searches', {
        params: {
          page: page,
          pageSize: pageSize
        }
      });
      setSavedSearches(response.data);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const handlePaginationChange = (pageNumber) => {
    setPage(pageNumber);
    fetchSavedSearches();
  };

  return (
    <div className="mb-4">
      <Table
        data={savedSearches.slice((page - 1) * pageSize, page * pageSize)}
        // ... other table props
      />
      <div className="mt-4">
        <Pagination
          totalRecords={savedSearches.length}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePaginationChange}
          className="pagination"
          activeClassName="active"
          prevPageLabel={"Previous"}
          nextPageLabel={"Next"}
        />
      </div>
    </div>
  );
};

export default SavedSearchQueries;
```