(function($) {

  var algolia = new AlgoliaSearch('sylvain', 'd962ad6512680f755df047e03a6af6fd');
  var helper = new AlgoliaSearchHelper(algolia, 'yelp_business', {
    facets: ['categories', 'open', 'review_count'],
    disjunctiveFacets: ['review_count_range', 'stars', 'city'],
    hitsPerPage: 10
  });

  var $hits = $('#hits');
  var $pagination = $('#pagination');
  var $stats = $('#stats');
  var $facets = $('#facets');
  var $q = $('#q');
  var $hitTemplate = Hogan.compile($('#hit-template').text());
  var $facetTemplate = Hogan.compile($('#facet-template').text());
  var $paginationTemplate = Hogan.compile($('#pagination-template').text());
  var $sliderTemplate = Hogan.compile($('#slider-template').text());
  var $statsTemplate = Hogan.compile($('#stats-template').text());

  Number.prototype.numberWithDelimiter = function(delimiter) {
    var number = this + '', delimiter = delimiter || ',';
    var split = number.split('.');
    split[0] = split[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter);
    return split.join('.');
  };

  function sortByCountDesc(a, b) { return b.count - a.count; }
  function sortByNumAsc(a, b) { return parseInt(a.label) - parseInt(b.label); }

  var FACETS = {
    'city': { title: 'City', sortFunction: sortByCountDesc },
    'open': { title: 'Open', sortFunction: sortByCountDesc },
    'review_count': { title: '# Reviews (slider)' },
    'review_count_range': { title: '# Reviews (range)', sortFunction: sortByNumAsc },
    'stars': { title: 'Rating', sortFunction: sortByNumAsc },
    'categories': { title: 'Categories', sortFunction: sortByCountDesc }
  };
  var refinements = {};
  var minReviewsCount = 0;

  function searchCallback(success, content) {
    if (!success || content.query != $q.val()) {
      return;
    }

    // stats
    $stats.html($statsTemplate.render({ query: content.query, nbHits: content.nbHits.numberWithDelimiter(), processingTimeMS: content.processingTimeMS, nbHits_plural: content.nbHits != 1 }));

    // hits
    var html = '';
    for (var i = 0; i < content.hits.length; ++i) {
      var hit = content.hits[i];

      // stars
      hit.star_image = 'stars_' + parseInt(hit.stars);
      if (hit.stars > 0 && parseInt(hit.stars) != hit.stars) {
        hit.star_image += '_half';
      }

      // hit rendering
      html += $hitTemplate.render(hit);
    }
    $hits.html(html);

    // facets
    html = '';
    for (var j = 0; j < 2; ++j) {
      var facetType = (['facets', 'disjunctiveFacets'])[j];
      for (var facet in content[facetType]) {

        if (facet === 'review_count') {
          // add a slider
          html += $sliderTemplate.render({ facet: facet, title: FACETS[facet].title, max: content.facets_stats[facet].max, current: minReviewsCount });
        } else {
          var values = [];
          // sort facets
          for (var v in content[facetType][facet]) {
            var label;
            if (facet === 'open' && v === 'true') {
              label = 'Open';
            } else if (facet === 'open' && v === 'false') {
              label = 'Closed';
            } else {
              label = v;
            }
            values.push({ label: label, value: v, count: content[facetType][facet][v], refined: helper.isRefined(facet, v) });
          }
          values.sort(FACETS[facet].sortFunction);

          // facet rendering
          html += $facetTemplate.render({
            facet: facet,
            title: FACETS[facet].title,
            values: values.slice(0, 10),
            has_other_values: values.length > 10,
            other_values: values.slice(10),
            disjunctive: facetType === 'disjunctiveFacets'
          });
        }
      }
    }
    $facets.html(html);

    // bind slider
    $('#review_count-slider').slider({
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

    // pagination
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
    location.replace('#q=' + encodeURIComponent(content.query) + '&page=' + content.page + '&minReviewsCount=' + minReviewsCount + '&refinements=' + JSON.stringify(refinements));
  }

  function search() {
    var params = {
      maxValuesPerFacet: 50
    };
    if (minReviewsCount > 0) {
      params.numericFilters = 'review_count>=' + minReviewsCount;
    }
    helper.search($q.val(), searchCallback, params);
  }

  // fetch anchor params
  if (location.hash && location.hash.indexOf('#q=') === 0) {
    var params = location.hash.substring(3);
    var pageParamOffset = params.indexOf('&page=');
    var minReviewsCountParamOffset = params.indexOf('&minReviewsCount=');
    var refinementsParamOffset = params.indexOf('&refinements=');

    var q = decodeURIComponent(params.substring(0, pageParamOffset));
    var page = parseInt(params.substring(pageParamOffset + 6, minReviewsCountParamOffset));
    minReviewsCount = parseInt(params.substring(minReviewsCountParamOffset + 17, refinementsParamOffset));
    var refinements = JSON.parse(params.substring(refinementsParamOffset + 13));

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
    helper.setPage(0);
    helper.toggleRefine(facet, value);
  };
  window.gotoPage = function(page) {
    helper.gotoPage(+page - 1);
  };
  window.sortBy = function(order, link) {
    $(link).closest('.btn-group').find('.sort-by').text($(link).text());
    switch (order) {
      case 'stars':
        helper.index = 'yelp_business_rating_desc';
        break;
      case 'review_count':
        helper.index = 'yelp_business_review_count_desc';
        break;
      default:
        helper.index = 'yelp_business';
    }
    helper.setPage(0);
    search();
  };

})(jQuery);
