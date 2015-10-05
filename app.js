// Instantiate the instantsearch application
app({
  appId: 'latency',
  apiKey: '6be0576ff61c053d5f9a3225e2a90f76',
  indexName: 'instant_search'
});

function app(opts) {
  /* global instantsearch */
  var search = instantsearch({
    appId: opts.appId,
    apiKey: opts.apiKey,
    indexName: opts.indexName,
    searchParameters: opts.searchParameters
  });

  var widgets = [
    instantsearch.widgets.searchBox({
      container: '#search-input'
    }),
    instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        hit: getTemplate('hit'),
        empty: getTemplate('no-results')
      }
    }),
    instantsearch.widgets.stats({
      container: '#stats',
      templates: {
        body: getTemplate('stats')
      }
    }),
    instantsearch.widgets.indexSelector({
      container: '#sort-by',
      indices: [{
        name: opts.indexName, label: 'Most relevant'
      }, {
        name: opts.indexName + '_price_asc', label: 'Lowest price'
      }, {
        name: opts.indexName + '_price_desc', label: 'Highest price'
      }]
    }),
    instantsearch.widgets.pagination({
      container: '#pagination',
      scrollTo: '#search-input'
    }),
    instantsearch.widgets.refinementList({
      container: '#category',
      facetName: 'categories',
      limit: 10,
      operator: 'or',
      templates: {
        header: getHeader('Category'),
        item: getTemplate('or-facet-item')
      }
    }),
    instantsearch.widgets.refinementList({
      container: '#brand',
      facetName: 'brand',
      limit: 10,
      operator: 'or',
      templates: {
        header: getHeader('Brand'),
        item: getTemplate('or-facet-item')
      }
    }),
    instantsearch.widgets.rangeSlider({
      container: '#price',
      facetName: 'price',
      templates: {
        header: getHeader('Price')
      }
    }),
    instantsearch.widgets.refinementList({
      container: '#type',
      facetName: 'type',
      operator: 'and',
      limit: 10,
      templates: {
        header: getHeader('Type'),
        item: getTemplate('single-refine-facet-item')
      }
    }),
    instantsearch.widgets.urlSync({
      useHash: true
    })
  ];

  widgets.forEach(search.addWidget, search);
  search.start();
}

function getTemplate(templateName) {
  return document.querySelector('#' + templateName + '-template').innerHTML;
}

function getHeader(title) {
  return '<h5>' + title + '</h5>';
}
