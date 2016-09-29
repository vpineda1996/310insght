### Sep 19 - Sep 25

  - IO/data persister
    - (V) Read from file
    - (V) Write to backup file
    - (V) Save onto disk
    - (V) Delete from disk/memory
    
  - Dataset parser
    - (H) multiple sources/structures
    
  - Define common data structure for data sets
    - (V) Design interface to access data sets
    - (V) accessors (get/set/delete/etc) rows
  
  - Query
    - (H) Query validators
    - (H) Implement WHERE: [allowed operations](https://github.com/ubccpsc/310/blob/2016sept/project/Deliverable1.md#where-ebnf)
    
### Sep 26 - Oct 2

  - Query
    - (H) Implement ORDER: sort
    - (H) Implement GET: returns copy of specified data
    - (H) Implement AS: formatting
  
  - (H) Non-cryptic Exception handling
  
  - Endpoints
    - (V) DELETE: call IO/data persister
