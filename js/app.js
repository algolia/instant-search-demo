$(document).ready(function() {

  /********************
  * INITIALIZATION
  * *******************/

  // REPLACE WITH YOUR OWN VALUES
  var APPLICATION_ID = 'latency';
  var SEARCH_ONLY_API_KEY = '6be0576ff61c053d5f9a3225e2a90f76';
  var INDEX_NAME = 'bestbuy';
  var HITS_PER_PAGE = 10;
  var FACET_CONFIG = [
  { name: 'type', title: 'Type', disjunctive: false, sortFunction: sortByCountDesc },
  { name: 'shipping', title: 'Shipping', disjunctive: false, sortFunction: sortByCountDesc },
  { name: 'customerReviewCount', title: '# Reviews', disjunctive: true, type: 'slider' },
  { name: 'category', title: 'Category', disjunctive: true, sortFunction: sortByCountDesc, topListIfRefined: true },
  { name: 'salePrice_range', title: 'Price range', disjunctive: true, sortFunction: sortByName },
  { name: 'manufacturer', title: 'Manufacturer', disjunctive: true, sortFunction: sortByName, topListIfRefined: true }
  ];
  var MAX_VALUES_PER_FACET = 30;
  // END REPLACE

  // DOM binding
  var $input = $('#q');
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

  // Client initialization
  var algolia = algoliasearch(APPLICATION_ID, SEARCH_ONLY_API_KEY);

  // Helper initialization
  var params = {
    hitsPerPage: HITS_PER_PAGE,
    maxValuesPerFacet: MAX_VALUES_PER_FACET,
    facets: $.map(FACET_CONFIG, function(facet) { return !facet.disjunctive ? facet.name : null; }),
    disjunctiveFacets: $.map(FACET_CONFIG, function(facet) { return facet.disjunctive ? facet.name : null; })
  };
  var helper = algoliasearchHelper(algolia, INDEX_NAME, params);

  // Input binding
  $input.on('keyup change', function() {
    var query = $input.val();
    toggleIconEmptyInput(!query.trim());
    helper.setQuery(query).search();
  }).focus();

  // AlgoliaHelper events
  helper.on('change', function(state) {
    setURL(state);
  });
  helper.on('error', function(error) {
    console.log(error);
  });
  helper.on('result', function(content, state) {
    renderStats(content);
    renderHits(content);
    renderFacets(content, state);
    renderPagination(content);
    bindSearchObjects();
  });


  /************
  * SEARCH
  * ***********/

  // Initial search
  init();

  function renderStats(content) {
    var stats =  {
      nbHits: content.nbHits.toLocaleString(),
      processingTimeMS: content.processingTimeMS.toLocaleString(),
      nbHits_plural: content.nbHits !== 1
    };
    $stats.html(statsTemplate.render(stats));
  }

  function renderHits(content) {
    var hitsHtml = '';
    for (var i = 0; i < content.hits.length; ++i) {
      hitsHtml += hitTemplate.render(content.hits[i]);
    }
    if (content.hits.length === 0) hitsHtml = '<p id="no-hits">We didn\'t find any products for your search.</p>';
    $hits.html(hitsHtml);
  }

  function renderFacets(content, state) {
    var facets = [];
    for (var i = 0; i < FACET_CONFIG.length; ++i) {
      var facet = FACET_CONFIG[i];
      var result = content.getFacetByName(facet.name);
      if (!result) { continue; }

      facet.values = [];

      if (facet.type === 'slider') {
        facet.min = 0;
        facet.max = result.stats.max;
        var min = state.getNumericRefinement(facet.name, '>=') || result.stats.min;
        var max = state.getNumericRefinement(facet.name, '<=') || result.stats.max;
        min = Math.min(facet.max, Math.max(facet.min, min));
        max = Math.min(facet.max, Math.max(facet.min, max));
        facet.values = [min, max];
      } else {
        // format and sort the facet values
        for (var v in result.data) {
          facet.values.push({ value: v, count: result.data[v].toLocaleString(), refined: helper.isRefined(facet.name, v) });
        }
        var sortFunction = facet.sortFunction || sortByCountDesc;
        if (facet.topListIfRefined) { sortFunction = sortByRefined(sortFunction); }
        facet.values.sort(sortFunction);
      }
      facet.more = facet.values.length > 9;
      facets.push(facet);
    }

    // Display facets
    var html = '';
    for (var i = 0; i < facets.length; ++i) {
      var facet = facets[i];
      if (facet.type && facet.type === 'slider') {
        html += sliderTemplate.render(facet);
      } else {
        html += facetTemplate.render(facet);
      }
    }
    $facets.html(html);
  }

  function renderPagination(content) {
    // If no results
    if (content.hits.length === 0) {
      $pagination.empty();
      return;
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
    // Display pagination
    $pagination.html(paginationTemplate.render(pagination));
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
  $(document).on('click','#facets .toggle',function(e) {
    e.preventDefault();
    var $ul = $(this).closest('ul');
    $ul.toggleClass('open');
    var $li = $ul.find('.toggle');
    if ( $ul.hasClass('open') ) {
      $li.find('.glyphicon').attr('class', 'glyphicon glyphicon-chevron-up');
      $li.find('span').text('less');
    } else {
      $li.find('.glyphicon').attr('class', 'glyphicon glyphicon-chevron-down');
      $li.find('span').text('more');
    }
    return false;
  });
  $(document).on('click','#facets [data-facet]',function() {
    helper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
    return false;
  });
  $(document).on('click','.gotoPage',function() {
    helper.setCurrentPage(+$(this).data('page') - 1).search();
    $("html, body").animate({scrollTop:0}, '500', 'swing');
    return false;
  });
  $(document).on('click','.sortBy',function() {
    $(this).closest('.btn-group').find('.sort-by').text($(this).text());
    helper.setIndex(INDEX_NAME + $(this).data('index-suffix')).search();
    return false;
  });
  $(document).on('click','#input-loop',function() {
    $input.val('').change();
  });

  // Dynamic styles
  $('#facets').on("mouseenter mouseleave", ".button-checkbox", function(e) {
    $(this).parent().find('.link').toggleClass("hover");
  });

  $('#facets').on("mouseenter mouseleave", ".link", function(e) {
    $(this).parent().find('.button-checkbox button.btn').toggleClass("hover");
  });

  /************
  * HELPERS
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

  var sortByCountDesc = function sortByCountDesc (a, b) {
    return b.count - a.count;
  };

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

  function setURL(state) {
    var hash = '#';
    var currentQuery = state.query;
    hash += 'q=' + encodeURIComponent(currentQuery);
    hash += '&page=' + (state.page + 1);
    for (var facetRefine in state.facetsRefinements) {
      hash += '&' + encodeURIComponent(facetRefine) + '=' + encodeURIComponent(state.facetsRefinements[facetRefine]);
    }
    for (var disjunctiveFacetrefine in state.disjunctiveFacetsRefinements) {
      for (var value in state.disjunctiveFacetsRefinements[disjunctiveFacetrefine]) {
        hash += '&' + encodeURIComponent(disjunctiveFacetrefine) + '=' + encodeURIComponent(state.disjunctiveFacetsRefinements[disjunctiveFacetrefine][value]);
      }
    }
    location.replace(hash);
  }

  function init() {
    var params = location.hash.split('&');
    var query = decodeURIComponent(params[0].split('=')[1] || '');
    $input.val(query);
    helper.setQuery(query);
    for (var i = 2; i < params.length; i++) {
      var param = params[i].split('=');
      var facet = decodeURIComponent(param[0]);
      var value = decodeURIComponent(param[1]);
      helper.toggleRefine(facet, value, false);
    }
    // Page has to be set in the end to avoid being overwritten
    if (params[1]) {
      var page = decodeURIComponent(params[1].split('=')[1]) - 1;
      helper.setCurrentPage(page);
    }
    helper.search();
  }
});

