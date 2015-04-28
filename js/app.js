$(document).ready(function() {


  /********************
  * INITIALIZATION
  * *******************/

  // Client initialization
  var algolia = algoliasearch('latency', '6be0576ff61c053d5f9a3225e2a90f76'); // replace by your own ApplicationID and SearchableOnlyAPIKey

  // DOM binding
  var $inputField = $('#q');
  var $hits = $('#hits');
  var $stats = $('#stats');
  var $facets = $('#facets');
  var $pagination = $('#pagination');

  // Templates binding
  var hitTemplate = Hogan.compile($('#hit-template').text());
  var statsTemplate = Hogan.compile($('#stats-template').text());
  var facetTemplate = Hogan.compile($('#facet-template').text());
  var sliderTemplate = Hogan.compile($('#slider-template').text());
  var paginationTemplate = Hogan.compile($('#pagination-template').text());

  // Initialize facets
  var FACETS = [
  { name: 'type',                title: 'Type',         disjunctive: false, sortFunction: sortByCountDesc },
  { name: 'shipping',            title: 'Shipping',     disjunctive: false, sortFunction: sortByCountDesc },
  { name: 'customerReviewCount', title: '# Reviews',    disjunctive: true,                                type: 'slider' },
  { name: 'category',            title: 'Category',     disjunctive: true, sortFunction: sortByCountDesc, topListIfRefined: true },
  { name: 'salePrice_range',     title: 'Price range',  disjunctive: true, sortFunction: sortByName },
  { name: 'manufacturer',        title: 'Manufacturer', disjunctive: true, sortFunction: sortByName,      topListIfRefined: true }
  ];

  // Helper initialization
  var indexName = 'bestbuy'; // replace by your own index name
  var params = {
    hitsPerPage: 10, // number of results per page
    maxValuesPerFacet: 30, // number of facets values retrieved
    facets: ['type', 'shipping'],
    disjunctiveFacets: ['customerReviewCount', 'category', 'salePrice_range', 'manufacturer']
  };
  var helper = algoliasearchHelper(algolia, indexName, params);

  // Input binding
  $inputField.on('keyup change', function() {
    var query = $inputField.val();
    toggleIconEmptyInput(!query.trim());
    helper.setQuery(query).search();
  }).focus();

  // AlgoliaHelper events
  helper.on('change', function(error) {
    // update URL anchor
    setURLParams(helper.state);
  });
  helper.on('error', function(error) {
    console.log(error);
  });
  helper.on('result', function(content) {
    var processedContent = processContent(content, this.state);
    displayContent(processedContent);
    bindSearchObjects();
  });

  // Dynamic styles
  $('#facets').on("mouseenter mouseleave", ".button-checkbox", function(e){
    $(this).parent().find('.facet_link').toggleClass("hover");
  });
  $('#facets').on("mouseenter mouseleave", ".facet_link", function(e){
    $(this).parent().find('.button-checkbox button.btn').toggleClass("hover");
  });


  /************
  * SEARCH
  * ***********/

  // Initial search
  initWithUrlParams();
  helper.search();

  // Process response sent by Algolia
  function processContent(content, state) {
    // Process stats
    var stats =  {
      nbHits: numberWithDelimiter(content.nbHits),
      processingTimeMS: content.processingTimeMS,
      nbHits_plural: content.nbHits !== 1
    };

    // Process hits
    var hits = content.hits;

    // Process facets
    var facets = [];
    for (var facetIndex = 0; facetIndex < FACETS.length; ++facetIndex) {
      var facetParams = FACETS[facetIndex];
      var facetResult = content.getFacetByName(facetParams.name);
      if (facetResult) {
        var facetContent = {};
        facetContent.facet = facetParams.name;
        facetContent.title = facetParams.title;
        facetContent.type = facetParams.type;

        // if the facet is a slider
        if (facetParams.type === 'slider') {
          facetContent.min = facetResult.stats.min;
          facetContent.max = facetResult.stats.max;
          var valueMin = state.getNumericRefinement('customerReviewCount', '>=') || facetResult.stats.min;
          var valueMax = state.getNumericRefinement('customerReviewCount', '<=') || facetResult.stats.max;
          valueMin = Math.min(facetContent.max, Math.max(facetContent.min, valueMin));
          valueMax = Math.min(facetContent.max, Math.max(facetContent.min, valueMax));
          facetContent.values = [valueMin, valueMax];
        } else {

          // format and sort the facet values
          var values = [];
          for (var v in facetResult.data) {
            values.push({ label: v, value: v, count: facetResult.data[v], refined: helper.isRefined(facetParams.name, v) });
          }
          var sortFunction = facetParams.sortFunction || sortByCountDesc;
          if (facetParams.topListIfRefined) sortFunction = sortByRefined(sortFunction);
          values.sort(sortFunction);

          facetContent.values = values.slice(0, 10);
          facetContent.has_other_values = values.length > 10;
          facetContent.other_values = values.slice(10);
          facetContent.disjunctive = facetParams.disjunctive;

        }
        facets.push(facetContent);
      }
    }

    // Process pagination
    var pages = [];
    if (content.page > 5) {
      pages.push({ current: false, number: 1 });
      pages.push({ current: false, number: '...', disabled: true });
    }
    for (var p = content.page - 5; p < content.page + 5; ++p) {
      if (p < 0 || p >= content.nbPages) {
        continue;
      }
      pages.push({ current: content.page === p, number: (p + 1) });
    }
    if (content.page + 5 < content.nbPages) {
      pages.push({ current: false, number: '...', disabled: true });
      pages.push({ current: false, number: content.nbPages });
    }
    var pagination = {
      pages: pages,
      prev_page: (content.page > 0 ? content.page : false),
      next_page: (content.page + 1 < content.nbPages ? content.page + 2 : false)
    };

    return {
      stats: stats,
      hits: hits,
      facets: facets,
      pagination: pagination
    };
  }

  // Display the content on the page
  function displayContent(content) {
    // Display stats
    $stats.html(statsTemplate.render(content.stats));

    // Display hits
    var hitsHtml = '';
    for (var i = 0; i < content.hits.length; ++i) {
      hitsHtml += hitTemplate.render(content.hits[i]);
    }
    if (content.hits.length === 0) hitsHtml = '<p id="no-hits">We didn\'t find any products for your search.</p>';
    $hits.html(hitsHtml);

    // Display facets
    var facetsHtml = '';
    for (var indexFacet = 0; indexFacet < content.facets.length; ++indexFacet) {
      var facet = content.facets[indexFacet];
      if (facet.type && facet.type === 'slider') facetsHtml += sliderTemplate.render(facet);
      else facetsHtml += facetTemplate.render(facet);
    }
    $facets.html(facetsHtml);
    if (content.hits.length === 0) $facets.empty();

    // Display pagination
    $pagination.html(paginationTemplate.render(content.pagination));
    if (content.hits.length === 0) $pagination.empty();
  }

  // Event bindings
  function bindSearchObjects() {
    // Slider binding
    $('#customerReviewCount-slider').slider().on('slideStop', function(ev) {
      helper.addNumericRefinement('customerReviewCount', '>=', ev.value[0]).search();
      helper.addNumericRefinement('customerReviewCount', '<=', ev.value[1]).search();
    });

    // Pimp checkboxes
    $('input[type="checkbox"]').checkbox();
  }

  // Click binding
  $(document).on('click','.show-more, .show-less',function() {
    $(this).closest('ul').find('.show-more').toggle();
    $(this).closest('ul').find('.show-less').toggle();
  });
  $(document).on('click','.toggleRefine',function() {
    helper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
  });
  $(document).on('click','.gotoPage',function() {
    helper.setCurrentPage(+$(this).data('page') - 1).search();
    window.scrollTo(0, 0);
  });
  $(document).on('click','.sortBy',function() {
    $(this).closest('.btn-group').find('.sort-by').text($(this).text());
    helper.setIndex(indexName + $(this).data('index-suffix')).search(); // Todo remove when new helper
  });
  $(document).on('click','#input-loop',function() {
    $inputField.val('').change();
  });


  /************
  * TOOLS
  * ***********/

  function toggleIconEmptyInput(isEmpty) {
    if(isEmpty) {
      $('#input-loop').addClass('glyphicon-loop');
      $('#input-loop').removeClass('glyphicon-remove');
    }
    else {
      $('#input-loop').removeClass('glyphicon-loop');
      $('#input-loop').addClass('glyphicon-remove');
    }
  }
  function numberWithDelimiter(number, delimiter) {
    number = number + '';
    delimiter = delimiter || ',';
    var split = number.split('.');
    split[0] = split[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
    return split.join('.');
  }
  var sortByCountDesc = function sortByCountDesc (a, b) { return b.count - a.count; };
  var sortByName = function sortByName (a, b) {
    return a.value.localeCompare(b.value);
  };
  var sortByRefined = function sortByRefined (sortFunction) {
    return function (a, b) {
      if (a.refined !== b.refined) {
        if (a.refined) return -1;
        if (b.refined) return 1;
      }
      return sortFunction(a, b);
    };
  };
  function initWithUrlParams() {
    var sPageURL = location.hash;
    if (!sPageURL || sPageURL.length === 0) { return true; }
    var sURLVariables = sPageURL.split('&');
    if (!sURLVariables || sURLVariables.length === 0) { return true; }
    var query = decodeURIComponent(sURLVariables[0].split('=')[1]);
    $inputField.val(query);
    helper.setQuery(query);
    for (var i = 2; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split('=');
      var facet = decodeURIComponent(sParameterName[0]);
      var value = decodeURIComponent(sParameterName[1]);
      helper.toggleRefine(facets, value, false);
    }
    // Page has to be set in the end to avoid being overwritten
    var page = decodeURIComponent(sURLVariables[1].split('=')[1])-1;
    helper.setCurrentPage(page);

  }
  function setURLParams(state) {
    var urlParams = '#';
    var currentQuery = state.query;
    urlParams += 'q=' + encodeURIComponent(currentQuery);
    var currentPage = state.page+1;
    urlParams += '&page=' + currentPage;
    for (var facetRefine in state.facetsRefinements) {
      urlParams += '&' + encodeURIComponent(facetRefine) + '=' + encodeURIComponent(state.facetsRefinements[facetRefine]);
    }
    for (var disjunctiveFacetrefine in state.disjunctiveFacetsRefinements) {
      for (var value in state.disjunctiveFacetsRefinements[disjunctiveFacetrefine]) {
        urlParams += '&' + encodeURIComponent(disjunctiveFacetrefine) + '=' + encodeURIComponent(state.disjunctiveFacetsRefinements[disjunctiveFacetrefine][value]);
      }
    }
    location.replace(urlParams);
  }

});

