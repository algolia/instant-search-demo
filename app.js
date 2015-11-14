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
    searchParameters: opts.searchParameters,
    urlSync: {
      useHash: true
    }
  });

  var widgets = [
    instantsearch.widgets.searchBox({
      container: '#search-input'
    }),
    instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        item: getTemplate('hit'),
        empty: getTemplate('no-results')
      }
    }),
    instantsearch.widgets.stats({
      container: '#stats'
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
      attributeName: 'categories',
      limit: 10,
      operator: 'or',
      templates: {
        header: getHeader('Category')
      }
    }),
    instantsearch.widgets.refinementList({
      container: '#brand',
      attributeName: 'brand',
      limit: 10,
      operator: 'or',
      templates: {
        header: getHeader('Brand')
      }
    }),
    instantsearch.widgets.rangeSlider({
      container: '#price',
      attributeName: 'price',
      templates: {
        header: getHeader('Price')
      }
    }),
    instantsearch.widgets.menu({
      container: '#type',
      attributeName: 'type',
      limit: 10,
      templates: {
        header: getHeader('Type')
      }
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
