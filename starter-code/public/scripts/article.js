'use strict';

function Article (opts) {
  // REVIEW: Convert property assignment to a new pattern. Now, ALL properties of `opts` will be
  // assigned as properies of the newly created article object. We'll talk more about forEach() soon!
  // We need to do this so that our Article objects, created from DB records, will have all of the DB columns as properties (i.e. article_id, author_id...)
  Object.keys(opts).forEach(function(e) {
    this[e] = opts[e]
  }, this);
}

Article.all = [];

// ++++++++++++++++++++++++++++++++++++++

// REVIEW: We will be writing documentation today for the methods in this file that handles Model layer of our application. As an example, here is documentation for Article.prototype.toHtml(). You will provide documentation for the other methods in this file in the same structure as the following example. In addition, where there are todo comment lines inside of the method, describe what the following code is doing (down to the next todo) and change the todo into a DONE when finished.

/**
 * OVERVIEW of Article.prototype.toHtml():
 * - A method on each instance that converts raw article data into HTML
 * - Inputs: nothing passed in; called on an instance of Article (this)
 * - Outputs: HTML of a rendered article template
 */
Article.prototype.toHtml = function() {
  // DONE: Retrieves the  article template from the DOM and passes the template as an argument to the Handlebars compile() method, with the resulting function being stored into a variable called 'template'.
  var template = Handlebars.compile($('#article-template').text());

  // DONE: Creates a property called 'daysAgo' on an Article instance and assigns to it the number value of the days between today and the date of article publication
  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // DONE: Creates a property called 'publishStatus' that will hold one of two possible values: if the article has been published (as indicated by the check box in the form in new.html), it will be the number of days since publication as calculated in the prior line; if the article has not been published and is still a draft, it will set the value of 'publishStatus' to the string '(draft)'
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';

  // DONE: Assigns into this.body the output of calling marked() on this.body, which converts any Markdown formatted text into HTML, and allows existing HTML to pass through unchanged
  this.body = marked(this.body);

// DONE: Output of this method: the instance of Article is passed through the template() function to convert the raw data, whether from a data file or from the input form, into the article template HTML
  return template(this);
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does: At a high level, this method takes an array as an argument, sorts the array by the property publishedOn. Then, once the array is sorted, it takes every item in the array, instantiates a new Article object, and pushes that object into the Article.all array that was declared on line 12.
 * - Inputs: identify any inputs and their source: Article.loadAll takes an argument that is an array.
 * - Outputs: identify any outputs and their destination: items in Articles.all that are new Article objects, sorted by date.
 */
Article.loadAll = function(rows) {
  // TODO: Takes the argument of "rows" from its parent function (Article.loadAll) and calls an array method of sort, which takes a function as an argument. The function takes two parameters, a and b, which are array items that have the property PublishedOn. It instantiates a new Date object using the string held by publishedOn for both index items, returns the difference between the one array item and the next one.
  rows.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // TODO: Takes the argument of "rows" from its parent function (Article.loadAll) and calls the array method of .forEach, which iterates through all items in the array. It takes an argument of a function (which takes an argument of ele, which represents each array item). Inside that function, the array method of push is called on the array of Article.all; a new Article object is instantiated for each item in the rows array.
  rows.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does: Methods check to see if records exist in the database and populates it from the local JSON file if not.
 * - Inputs: identify any inputs and their source
 * - Outputs: identify any outputs and their destination
 */
Article.fetchAll = function(callback) {
  // TODO: Calls the jQuery AJAX method of .get on the route of /articles. Loads data from a server using an HTTP GET request.
  $.get('/articles')
  // TODO: describe what the following code is doing: then method is called with an argument of an anonymous callback function with a parameter of results.
  .then(
    function(results) {
      if (results.length) { // If records exist in the DB
        // TODO: If the record exists in the DB, the Article.loadAll method is called with results as an argument. Then the fetchAll method's argument is called.
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // TODO: call a jQuery AJAX method that gets JSON data from the local JSON file in the data folder.
        $.getJSON('./data/hackerIpsum.json')
        .then(function(rawData) {
          rawData.forEach(function(item) {
            let article = new Article(item);
            article.insertRecord(); // Add each record to the DB
          })
        })
        // TODO: Now that the database has been populated from the local JSON file, call the fetchAll method again.
        .then(function() {
          Article.fetchAll(callback);
        })
        // TODO: In case the output is outside of the if/else statement, run the .catch method with a callback function with an parameter of error. Console.error the error received.
        .catch(function(err) {
          console.error(err);
        });
      }
    }
  )
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does: Takes parameter of callback
 * - Inputs: identify any inputs and their source: callback, console.log of data
 * - Outputs: identify any outputs and their destination. outputs table data (IS THIS DATA WHAT REMAINS OR WHAT HAS BEEN DELETED?)
 */
Article.truncateTable = function(callback) {
  // TODO: describe what the following code is doing: AJAX selector that gets route of /articles and tells it to delete what has been selected.
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
  // TODO: .then takes an argument of an anonymous function with a argument of data returned by the AJAX call, logs it. If the callback argument exists, call the callback function. This is an acknowledgement of what has been deleted?
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does
 * - Inputs: identify any inputs and their source
 * - Outputs: identify any outputs and their destination
 */
Article.prototype.insertRecord = function(callback) {
  // TODO: describe what the following code is doing
  $.post('/articles', {author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title})
  // TODO: describe what the following code is doing
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  })
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does
 * - Inputs: identify any inputs and their source
 * - Outputs: identify any outputs and their destination
 */
Article.prototype.deleteRecord = function(callback) {
  // TODO: describe what the following code is doing
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
  // TODO: describe what the following code is doing
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// TODO
/**
 * OVERVIEW of
 * - Describe what the method does
 * - Inputs: identify any inputs and their source
 * - Outputs: identify any outputs and their destination
 */
Article.prototype.updateRecord = function(callback) {
  // TODO: describe what the following code is doing
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // TODO: describe what this object is doing
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
  // TODO: describe what the following code is doing
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};
