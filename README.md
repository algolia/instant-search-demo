**Note:** this repository is hosting the demo that was previously located at [algolia/examples](https://github.com/algolia/examples/tree/master/instant-search/instantsearch.js/)

-----

Instant-Search Demo
====================

This is a sample project of an [Algolia](http://www.algolia.com) Instant-Search result page on an e-commerce website. Algolia is a Search API that provides a hosted full-text, numerical and faceted search.

## Demos
Try out the [demo](https://preview.algolia.com/instantsearch/)
![Instant search](screenshots/instant-search-default.gif)

### Simplified version
This project also includes a simplified version of the implementation that includes a few less filtering options.
The code is available in the files `index-simplified.html` and `search-simplified.js`. You can [see it live here](https://preview.algolia.com/instantsearch/index-simplified.html).

## Features
* Full-JavaScript/frontend implementation based on [instantsearch.js](https://community.algolia.com/instantsearch.js/)
* Results page refreshed as you type
* Relevant results from the first keystroke
* Rich set of filters
  * Multi-level categories
  * Range slider
  * Star rating
* Typo-tolerance
* Multiple sort orders
  * By Relevance
  * By Highest Price
  * By Lowest Price
* Backup search parameters in the URL

## Run and develop locally

First, [install nvm](https://github.com/creationix/nvm#installation), then run:

```sh
git clone git@github.com:algolia/instant-search-demo.git
cd instant-search-demo
nvm use
npm install
npm start
open http://localhost:3000
```

We've included some credentials in the code allowing you to test the demo without any Algolia account.

### Data import
If you want to replicate this demo using your own Algolia credentials that you can obtain creating a free account on Algolia.com.

Just install the Ruby `algoliasearch` gem and use the `push.rb` script to send the data and automatically configure the product index (same for both versions).

```sh
$ gem install algoliasearch
$ ./dataset_import/push.rb YourApplicationID YourAdminAPIKey YourIndexName
```

Then, you'll need to replace the demo credentials with your own:
- in `search.js` and `search-simplified.js`, set your own `APPLICATION_ID` instead of `"latency"` (which is our demo `APPLICATION_ID`),
- in `search.js` and `search-simplified.js`, set your own `SEARCH_ONLY_API_KEY` instead of `"6be0576ff61c053d5f9a3225e2a90f76"`,
- in `search.js` and `search-simplified.js`, set your own `index` name instead of `"instant_search"`.


We've extracted 20 000+ products from the [Best Buy Developer API](https://developer.bestbuy.com). You can find the associated documentation [here](https://developer.bestbuy.com/documentation/products-api).

## Tutorial

**Follow this [step by step tutorial](https://www.algolia.com/doc/tutorials/search-ui/instant-search/build-an-instant-search-results-page/instantsearchjs/) (on Algolia.com) to learn how this implementation works** and how it has been built using the [instantsearch.js library](https://community.algolia.com/instantsearch.js/).

A more general overview of filtering and faceting is available in a [dedicated tutorial](https://www.algolia.com/doc/tutorials/search-ui/instant-search/filtering/faceting-search-ui/instantsearchjs/).

## Deployment

Following sections help you to deploy the demo website.

1. [The hard way](#self-hosted---the-hard-way)
2. [The easy way](#github-pages---the-easy-way)
3. [The cloud native way](#kubernetes---the-cloud-native-way)

### Self hosted - the hard way

The hard way is to manage your own webserver and serve the static files.

As an example, see the [Nginx documentation](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/) which can be deployed with the [free Nginx software](https://nginx.org/en/docs/).

You are responsible to manage application deployment, which means you need to take care about security, monitoring and rollback in case of failure.

### Github pages - the easy way

The easiest way to deploy this demo is through [GitHub Pages](https://pages.github.com/) with your own fork.
See here the result: <https://holyhope-algolia.github.io/instant-search-demo/>

Github automatically handle SSL and basic webserver settings. It ensures itself to automatically deploys the desired branch.
Take care about application version, in case of bad commit, you will need to rollback/revert the commit.

### Kubernetes - the cloud native way

The most CloudNative solution would be to deploy the demo in your Kubernetes cluster.

_Required command line interfaces_: [`docker`](https://docs.docker.com/get-docker/), [`helm`](https://helm.sh/docs/intro/install/), [`npm`](https://docs.npmjs.com/getting-started)

1. Build the container image and the Helm chart, then push the image:

   ```bash
   export docker_registry=docker.io/holyhope
   npm run build
   npm run publish
   ```

1. Be ready to expose the new service.

   The recommended way is by using an [Ingress Controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/). Select the one depending of your cluster configuration. If you do not know which one is appropriated, [nginx controller](https://github.com/kubernetes/ingress-nginx/blob/main/README.md#readme) should do the trick.

   This controller will help you to setup the SSL protocol.

1. Great! After that, install the website thanks to the chart:

   ```bash
   npm run deploy
   ```

   In case of error, do not panic, the service is still up since the new deployment is not yet exposed.
   __Please rollback this bad deployment otherwise, in some edge case, the last working deployment may failed and never go up and running again.__

   1. Identify the previous working version:

      ```bash
      helm history -n algolia instant-search-demo
      ```

   1. Rollback to the desired version:

      ```bash
      helm rollback -n algolia instant-search-demo $the_version
      ```

   Pro tip: you can also rollback automatically on failure with a single command:
   ```bash
   npm run deploy || helm rollback -n algolia instant-search-demo $(helm history -n algolia instant-search-demo -o json | jq '.[] | select(.status == "deployed").revision')
   ```