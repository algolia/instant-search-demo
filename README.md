Instant-Search Demo
====================

This is a sample project implementing an instant-search based e-commerce website with [Algolia](http://www.algolia.com). Algolia is a Search API that provides hosted full-text, numerical and faceted search.

#### Features
 * Full JavaScript (based on [jQuery](http://jquery.com/), [Hogan.js](http://twitter.github.io/hogan.js/) and [AlgoliaSearch](https://github.com/algolia/algoliasearch-client-js))
 * Results page refreshed as you type
   * Hits
   * Facets
   * Pagination
 * Relevant results from the first keystroke
 * Typo-tolerance
 * Multiple sort orders
   * By Relevance
   * By Highest Ratings
   * By Highest Review Count
 * Backup search parameters in the URL

Data Set
---------
We've extracted about 13,500 businesses from [Yelp's Academic Dataset](http://www.yelp.com/academic_dataset). You can find it [here](https://github.com/algolia/instant-search-demo/raw/master/data.json).

