#! /usr/bin/env ruby

require 'json'
require 'algoliasearch'
require 'open-uri'

if ARGV.length != 3
  $stderr << "usage: push.rb APPLICATION_ID API_KEY INDEX\n"
  exit 1
end

products = JSON.parse File.read('data.json')
products_manufacturers = {}
products.each do |product|
  products_manufacturers[product['manufacturer']] = 0 unless products_manufacturers.has_key?(product['manufacturer'])
  products_manufacturers[product['manufacturer']] += 1
end

products_manufacturers_objects = []
products_manufacturers.each do |key, value|
  products_manufacturers_objects.push({ 
    :objectID => key,
    :name => key,
    :product_count => value
  }) unless key.nil?
end

Algolia.init :application_id => ARGV[0], :api_key => ARGV[1], :hosts => ['c1-eu-1.algolia.net', 'c1-eu-2.algolia.net', 'c1-eu-3.algolia.net']
index = Algolia::Index.new("#{ARGV[2]}_manufacturer")
index.set_settings :attributesToIndex => ["name"],
  :customRanking => ["desc(product_count)"]
index.clear_index! rescue 'not fatal'
res = index.add_objects products_manufacturers_objects
index.wait_task res['taskID']
