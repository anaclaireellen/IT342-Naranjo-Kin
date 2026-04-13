// STRATEGY PATTERN: Different algorithms for searching
export const SearchStrategies = {
  byUsername: (list, query) => 
    list.filter((item) => {
      const label = item.username || item.name || '';
      return label.toLowerCase().includes(query.toLowerCase());
    }),
    
  byNeed: (list, query) => 
    list.filter(item => item.need?.toLowerCase().includes(query.toLowerCase())),
};
