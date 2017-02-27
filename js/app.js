$(document).ready(function() {
  /* global instantsearch */

var search = instantsearch({
  appId: 'L5L26RJU8H',
  apiKey: '70b5af96015841a8b4b19ccf72e3894b',
  indexName: 'netflix2',
  urlSync: {}
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#q'
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);

var hitTemplate =
  '<div class="hit media">' +
    '<div class="media-left">' +
      '<div class="media-object" style="background-image: url(\'{{image}}\');"></div>' +
    '</div>' +
    '<div class="media-body">' +
      '<h4 class="media-heading">{{{_highlightResult.SeriesTitle.value}}}</h4>' +
      '<p class="synop">{{{_highlightResult.ContentSynopsis.value}}}</p>' +
      '<p class="genre"><span class="badge">{{Genre}}</span><span class="badge">Popularity: {{Popularity}}</span>' +
      '<span class="badge">Season: {{RefSeriesSeason}}</span><span class="badge">Episode: {{EpisodeNo}}</span></p>' +
    '</div>' +
  '</div>';

var noResultsTemplate =
  '<div class="text-center">No results found matching <strong>{{query}}</strong>.</div>';

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 10,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate
    },
    transformData: function(hit) {
      if (hit.SeriesTitle == ""){
        hit.SeriesTitle = hit.name;
        hit._highlightResult.SeriesTitle.value = hit.name;

      }
      hit.stars = [];
      hit.image = " http://placehold.it/130x130";
      for (var i = 1; i <= 5; ++i) {
        hit.stars.push(i <= hit.rating);
      }
      return hit;
    }
  })
);

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClasses: {
      root: 'pagination',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#genres',
    attributeName: 'Genre',
    operator: 'and',
    limit: 10,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);
search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#language',
    attributeName: 'Language',
    operator: 'and',
    limit: 10,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);

// search.addWidget(
//   instantsearch.widgets.starRating({
//     container: '#ratings',
//     attributeName: 'rating',
//     cssClasses: {
//       list: 'nav',
//       count: 'badge pull-right'
//     }
//   })
// );

search.start();
});
