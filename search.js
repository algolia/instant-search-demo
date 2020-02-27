/* global instantsearch algoliasearch */

app({
  appId: 'latency',
  apiKey: '6be0576ff61c053d5f9a3225e2a90f76',
  indexName: 'instant_search',
  searchParameters: {
    hitsPerPage: 10,
  },
});

function app(opts) {
  // ---------------------
  //
  //  Init
  //
  // ---------------------
  const search = instantsearch({
    searchClient: algoliasearch(opts.appId, opts.apiKey),
    indexName: opts.indexName,
    routing: true,
    searchFunction: opts.searchFunction,
  });

  // ---------------------
  //
  //  Default widgets
  //
  // ---------------------
  search.addWidgets([
    instantsearch.widgets.searchBox({
      container: '#search-input',
      placeholder: 'Search for products by name, type, brand, ...',
    }),
    instantsearch.widgets.hits({
      container: '#hits',
      templates: {
        item: getTemplate('hit'),
        empty: getTemplate('no-results'),
      },
      transformItems(items) {
        return items.map(item => {
          /* eslint-disable no-param-reassign */
          item.starsLayout = getStarsHTML(item.rating);
          item.categories = getCategoryBreadcrumb(item);
          return item;
        });
      },
    }),
    instantsearch.widgets.stats({
      container: '#stats',
    }),
    instantsearch.widgets.sortBy({
      container: '#sort-by',
      items: [
        {
          value: opts.indexName,
          label: 'Most relevant',
        },
        {
          value: `${opts.indexName}_price_asc`,
          label: 'Lowest price',
        },
        {
          value: `${opts.indexName}_price_desc`,
          label: 'Highest price',
        },
      ],
    }),
    instantsearch.widgets.pagination({
      container: '#pagination',
      scrollTo: '#search-input',
    }),

    // ---------------------
    //
    //  Filtering widgets
    //
    // ---------------------
    instantsearch.widgets.hierarchicalMenu({
      container: '#hierarchical-categories',
      attributes: [
        'hierarchicalCategories.lvl0',
        'hierarchicalCategories.lvl1',
        'hierarchicalCategories.lvl2',
      ],
      showParentLevel: true,
      templates: {
        header: getHeader('Category'),
        item:  '<a href="{{url}}" class="facet-item {{#isRefined}}active{{/isRefined}}"><span class="facet-name"><i class="fa fa-angle-right"></i> {{label}}</span class="facet-name"><span class="ais-hierarchical-menu--count">{{count}}</span></a>' // eslint-disable-line
      },
    }),
    instantsearch.widgets.refinementList({
      container: '#brand',
      attribute: 'brand',
      limit: 5,
      showMore: true,
      showMoreLimit: 10,
      searchForFacetValues: {
        placeholder: 'Search for brands',
        templates: {
          noResults: '<div class="sffv_no-results">No matching brands.</div>',
        },
      },
      templates: {
        header: getHeader('Brand'),
        showMoreText: `
          {{#isShowingMore}}
            <span class="isShowingLess"></span>
            Show less
          {{/isShowingMore}}
          {{^isShowingMore}}
            <span class="isShowingMore"></span>
            Show more
          {{/isShowingMore}}
        `,
      },
      collapsible: {
        collapsed: false,
      },
    }),
    instantsearch.widgets.rangeSlider({
      container: '#price',
      attribute: 'price',
      tooltips: {
        format(rawValue) {
          return `$${Math.round(rawValue).toLocaleString()}`;
        },
      },
      templates: {
        header: getHeader('Price'),
      },
      collapsible: {
        collapsed: false,
      },
    }),
    instantsearch.widgets.ratingMenu({
      container: '#stars',
      attribute: 'rating',
      max: 5,
      labels: {
        andUp: '& Up',
      },
      templates: {
        header: getHeader('Rating'),
      },
      collapsible: {
        collapsed: false,
      },
    }),
    instantsearch.widgets.toggleRefinement({
      container: '#free-shipping',
      attribute: 'free_shipping',
      label: 'Free Shipping',
      values: {
        on: true,
      },
      templates: {
        header: getHeader('Shipping'),
      },
      collapsible: {
        collapsed: true,
      },
    }),
    instantsearch.widgets.menu({
      container: '#type',
      attribute: 'type',
      limit: 10,
      showMore: true,
      templates: {
        header: getHeader('Type'),
        showMoreText: `
          {{#isShowingMore}}
            <span class="isShowingLess"></span>
            Show less
          {{/isShowingMore}}
          {{^isShowingMore}}
            <span class="isShowingMore"></span>
            Show more
          {{/isShowingMore}}
        `,
      },
      collapsible: {
        collapsed: true,
      },
    }),
  ]);

  search.start();
}

// ---------------------
//
//  Helper functions
//
// ---------------------
function getTemplate(templateName) {
  return document.querySelector(`#${templateName}-template`).innerHTML;
}

function getHeader(title) {
  return `<h5>${title}</h5>`;
}

function getCategoryBreadcrumb(item) {
  const highlightValues = item._highlightResult.categories || [];
  return highlightValues.map(category => category.value).join(' > ');
}

function getStarsHTML(rating, maxRating) {
  let html = '';
  const newRating = maxRating || 5;

  for (let i = 0; i < newRating; ++i) {
    html += `<span class="ais-star-rating--star${
      i < rating ? '' : '__empty'
    }"></span>`;
  }

  return html;
}
