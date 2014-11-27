(function($) {
  // Client initialization
    var algolia = new AlgoliaSearch('latency', '6be0576ff61c053d5f9a3225e2a90f76', {dsn: true, tld: 'net'}); // replace by your own ApplicationID and SearchableOnlyAPIKey

  // DOM binding
  var $hits = $('#hits');
  var $pagination = $('#pagination');
  var $stats = $('#stats');
  var $q = $('#q');
  var $hitTemplate = Hogan.compile($('#hit-template').text());
  var $statsTemplate = Hogan.compile($('#stats-template').text());
  var $paginationTemplate = Hogan.compile($('#pagination-template').text());
  var $facets = $('#facets');
  var $facetTemplate = Hogan.compile($('#facet-template').text());
  var $sliderTemplate = Hogan.compile($('#slider-template').text());

  // Helper initialization
  var index = 'bestbuy'; // replace by your own index name
  var helper = new AlgoliaSearchHelper(algolia, index, {
    // list of conjunctive facets (link to refine)
    facets: ['type', 'shipping', 'customerReviewCount'],

    // list of disjunctive facets (checkbox to refine)
    disjunctiveFacets: ['category', 'salePrice_range', 'manufacturer'],

    // number of results per page
    hitsPerPage: 10
  });

  // Helpers
  Number.prototype.numberWithDelimiter = function(delimiter) {
    var number = this + '', delimiter = delimiter || ',';
    var split = number.split('.');
    split[0] = split[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
    return split.join('.');
  };

  // Facets ordered by order of display: here type will be displayed first and manufacture at the end
  // Also includes the refinements initialization & configuration
  function sortByCountDesc(a, b) { return b.count - a.count; }
  function sortByNumAsc(a, b) { return parseInt(a.label) - parseInt(b.label); }
  var FACETS = [
    { name: 'type', title: 'Type', sortFunction: sortByCountDesc },
    { name: 'shipping', title: 'Shipping', sortFunction: sortByCountDesc },
    { name: 'customerReviewCount', title: '# Reviews' },
    { name: 'category', title: 'Categories', sortFunction: sortByCountDesc, topListIfRefined: true },
    { name: 'salePrice_range', title: 'Price', sortFunction: sortByNumAsc },
    { name: 'manufacturer', title: 'Manufacturer', sortFunction: sortByNumAsc, topListIfRefined: true }
  ];
  var refinements = {};
  var minReviewsCount = 0;

  // Callback called on each keystroke, rendering the results
  function searchCallback(success, content) {
    if (!success || content.query !== $q.val()) {
      // do not consider the result if there is an error
      // or if it is outdated -> query != $q.val()
      return;
    }

    // stats: render the number of results + processing time
    $stats.html($statsTemplate.render({ query: content.query, nbHits: content.nbHits.numberWithDelimiter(), processingTimeMS: content.processingTimeMS, nbHits_plural: content.nbHits != 1 }));

    // hits: display the `hitsPerPage` results
    var html = '';
    for (var i = 0; i < content.hits.length; ++i) {
      html += $hitTemplate.render(content.hits[i]);
    }
    $hits.html(html);

    // facets: display the conjunctive+disjunctive facets
    html = '';
    var facetResult = null;
    var facetConfig = null;
    var isDisjunctive = null; 

    for (var j=0; j<FACETS.length; ++j) {
      facetConfig = FACETS[j];
      facetResult = content['facets'][facetConfig.name] || content['disjunctiveFacets'][facetConfig.name] || null;
      isDisjunctive = (content['disjunctiveFacets'][facetConfig.name]) ? true : false;

      if (facetResult) {
        
        if (facetConfig.name === 'customerReviewCount') {
          // add a slider fetching the 'max' value of 'customerReviewCount' from `content.facets_stats.customerReviewCount`
          html += $sliderTemplate.render({ facet: facetConfig.name, title: facetConfig.title, max: content.facets_stats.customerReviewCount.max, current: minReviewsCount });
        } else {
          // other facets

          // collect all values from `facetResult` to sort them by facetConfig.sortFunction
          var values = [];
          for (var v in facetResult) {
            values.push({ label: v, value: v, count: facetResult[v], refined: helper.isRefined(facetConfig.name, v) });
          }
          // sort the values
          values.sort(function(a, b) {
            // If topListIfRefined === true: sort by the refined states first (put them on top if they are refined).
            if (facetConfig.topListIfRefined) {
              if (a.refined !== b.refined) {
                if (a.refined) return -1;
                if (b.refined) return 1;
              }
            }

            // then fallback on the standard sort function
            return facetConfig.sortFunction(a,b);
          });

          // render the facet
          html += $facetTemplate.render({
            facet: facetConfig.name,
            title: facetConfig.title,
            values: values.slice(0, 10),
            has_other_values: values.length > 10,
            other_values: values.slice(10),
            disjunctive: isDisjunctive
          });
        }
      
      }
    }
    $facets.html(html);

    // bind slider
    $('#customerReviewCount-slider').slider({
      formater: function(e) {
        if (e === 0) {
          return 'All';
        }
        return '> ' + e;
      }
    }).on('slideStop', function(ev) {
      minReviewsCount = ev.value;
      search();
    });

    // pimp checkboxes
    $('input[type="checkbox"]').checkbox();

    // render pagination
    var pages = [];
    if (content.page > 5) {
      pages.push({ current: false, number: 1 });
      pages.push({ current: false, number: '...', disabled: true });
    }
    for (var p = content.page - 5; p < content.page + 5; ++p) {
      if (p < 0 || p >= content.nbPages) {
        continue;
      }
      pages.push({ current: content.page == p, number: (p + 1) });
    }
    if (content.page + 5 < content.nbPages) {
      pages.push({ current: false, number: '...', disabled: true });
      pages.push({ current: false, number: content.nbPages });
    }
    $pagination.html($paginationTemplate.render({ pages: pages, prev_page: (content.page > 0 ? content.page : false), next_page: (content.page + 1 < content.nbPages ? content.page + 2 : false) }));

    // update URL anchor
    var refinements = [];
    for (var refine in helper.refinements) {
      if (helper.refinements[refine]) {
        var i = refine.indexOf(':');
        var r = {};
        r[refine.slice(0, i)] = refine.slice(i + 1);
        refinements.push(r);
      }
    }
    for (var refine in helper.disjunctiveRefinements) {
      for (var value in helper.disjunctiveRefinements[refine]) {
        if (helper.disjunctiveRefinements[refine][value]) {
          var r = {};
          r[refine] = value;
          refinements.push(r);
        }
      }
    }
    location.replace('#q=' + encodeURIComponent(content.query) + '&page=' + content.page + '&minReviewsCount=' + minReviewsCount + '&refinements=' + encodeURIComponent(JSON.stringify(refinements)));

    // scroll on top
    window.scrollTo(0, 0);
  }

  // perform a search
  function search() {
    var params = {
      // retrieve maximum 50 values per facet to display the "more" link
      maxValuesPerFacet: 50
    };
    // plug review_count slider refinement
    if (minReviewsCount > 0) {
      params.numericFilters = 'customerReviewCount>=' + minReviewsCount;
    }
    // if we're sorting by something,
    // make the typo-tolerance more strict
    if (helper.index != index) {
      // disable if not the "default" index (sort by price, etc...)
      params.typoTolerance = false;
    }
    // perform the query
    helper.search($q.val(), searchCallback, params);
  }

  // init: fetch anchor params and init the associated variables
  if (location.hash && location.hash.indexOf('#q=') === 0) {
    var params = location.hash.substring(3);
    var pageParamOffset = params.indexOf('&page=');
    var minReviewsCountParamOffset = params.indexOf('&minReviewsCount=');
    var refinementsParamOffset = params.indexOf('&refinements=');

    var q = decodeURIComponent(params.substring(0, pageParamOffset));
    var page = parseInt(params.substring(pageParamOffset + 6, minReviewsCountParamOffset));
    minReviewsCount = parseInt(params.substring(minReviewsCountParamOffset + 17, refinementsParamOffset));
    var refinements = JSON.parse(decodeURIComponent(params.substring(refinementsParamOffset + 13)));

    $q.val(q);
    for (var i = 0; i < refinements.length; ++i) {
      for (var refine in refinements[i]) {
        helper.toggleRefine(refine, refinements[i][refine]);
      }
    }
    helper.setPage(page);
  }

  // input binding
  var lastQuery = $q.val();
  $q.on('keyup change', function() {
    if ($q.val() != lastQuery) {
      lastQuery = $q.val();
      // performing a new full-text query reset the pagination and the refinements
      minReviewsCount = 0;
      helper.setPage(0);
      helper.clearRefinements();
      search();
    }
  }).focus();

  // load results
  search();

  // click binding
  window.showMoreLess = function(link) {
    $(link).closest('ul').find('.show-more').toggle();
  };
  window.toggleRefine = function(facet, value) {
    // refinining a facet reset the pagination
    helper.setPage(0);
    helper.toggleRefine(facet, value);
  };
  window.gotoPage = function(page) {
    helper.gotoPage(+page - 1);
  };
  window.sortBy = function(index_suffic, link) {
    $(link).closest('.btn-group').find('.sort-by').text($(link).text());
    // set target index name
    helper.index = index + index_suffic;
    // reset page
    helper.setPage(0);
    // perform the query
    search();
  };

})(jQuery);
