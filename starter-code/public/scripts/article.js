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

// DONE
/**
 * OVERVIEW of Article.loadAll
 * - Describe what the method does: At a high level, this method takes an array as an argument and sorts the array items (which are objects) by date. Then, once the array is sorted, it instantiates a new Article object and pushes that object into the Article.all array that was declared on line 12.
 * - Inputs: identify any inputs and their source: Article.loadAll takes an argument that is an array.
 * - Outputs: identify any outputs and their destination: items in Articles.all that are new Article instances, sorted by date.
 */
Article.loadAll = function(rows) {
  // DONE: Takes the argument of "rows" from its parent function (Article.loadAll) and calls an array method of sort, which takes a function as an argument. The function takes two parameters, a and b, which are array items that have the property PublishedOn. It instantiates a new Date object using the string held by publishedOn for both index items, returns the difference between the one array item and the next one and orders the array items based on that difference.
  rows.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // DONE: Takes the argument of "rows" from its parent method/function (Article.loadAll) and calls the array method of .forEach, which iterates through all items in the array. It takes an argument of a function (which takes an argument of ele, which represents each array item). Inside that function, the array method of push is called on the array of Article.all; a new Article instance is created for each item in the rows array.
  rows.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.fetchAll
 * - Describe what the method does: This is a method to check to see if records exist in the database and populates it from the local JSON file if not.
 * - Inputs: a parameter of callback (a function)
 * - Outputs: Depends on the state of the database.
 */
Article.fetchAll = function(callback) {
  // DONE: Calls the jQuery AJAX method of .get on the route of /articles. Gets data from a server using an HTTP GET request.
  $.get('/articles')
  // DONE: Once AJAX call is done, the then method is called with an argument of an anonymous callback function with a parameter of results.
  .then(
    function(results) {
      if (results.length) { // If records exist in the DB
        // DONE: If the results of the .get call exist in the DB, the Article.loadAll method is called with results as an argument. Then the callback function is called.
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // DONE: call a jQuery AJAX method that gets JSON data from the local JSON file in the data folder. Once that call has completed, take the array that was returned, instantiate a new Article object for each item in that array, and call the insertRecord method on it to put it in the DB.
        $.getJSON('./data/hackerIpsum.json')
        .then(function(rawData) {
          rawData.forEach(function(item) {
            let article = new Article(item);
            article.insertRecord(); // Add each record to the DB
          })
        })
        // DONE: Once the database has been populated from the local JSON file, call the fetchAll method again.
        .then(function() {
          Article.fetchAll(callback);
        })
        // DONE: In case the output is outside of the if/else statement, run the .catch method with a callback function with an parameter of error. Console.error the error received.
        .catch(function(err) {
          console.error(err);
        });
      }
    }
  )
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.truncateTable
 * - Describe what the method does: Makes a jQuery AJAX call to the articles route with a delete method. Once the call has been returned, a log of the data returned and a callback function executes (if it exists).
 * - Inputs: optional callback function
 * - Outputs: Outputs a log of table data that has been truncated
 */
Article.truncateTable = function(callback) {
  // DONE: describe what the following code is doing: jQuery AJAX selector that gets route of /articles and tells it to delete what has been selected.
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
  // DONE: once a response to the AJAX call is received, an anonymous callback function with an argument of data returned from the call runs. The data is logged, and if a callback was passed in as an argument, it will run.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.insertRecord
 * - Adds a record to our database
 * - Inputs: optional callback, properties from Article instance
 * - Outputs: console.log of data inserted
 */
Article.prototype.insertRecord = function(callback) {
  // DONE: sends an instance of an article object to our articles route for storage in the database
  $.post('/articles', {author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title})
  // DONE: once a response to the AJAX call is received, an anonymous callback function with an argument of data returned from the call runs. The data is logged, and if a callback was passed in as an argument, it will run.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.deleteRecord
 * - Describe what the method does: This method on the Article proto makes an AJAX HTTP request on an article of a particular ID and deletes it. After the AJAX call completes, the data that was deleted is logged, and if a callback function has been passed as an argument, it will run.
 * - Inputs: callback function argument, the id of the instance of article
 * - Outputs: console.log of data, result of callback function, an updated database
 */
Article.prototype.deleteRecord = function(callback) {
  // DONE: Makes an HTTP request using jQuery ajax call accessing the articles ID from the article instance this method is called on. The request is with an HTTP request method of Delete. Performs a delete operation on the instance of Article in the database.
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
  // DONE: After the AJAX call has finished, the .then method is called an argument of an anonymous callback function which has an argument of data. The function first logs the data property from the HTTP request, which will be the data that was deleted. Then, if a callback function was passed as an argument of the .deleteRecord, it will be called.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
* OVERVIEW of Article.prototype.updateRecord
* - Describe what the method does: This method attaches a prototype of updateRecord to Article.  It uses AJAX to get a particular article id and puts the data listed into the table and if a callback function has been passed as an argument, it will run.
* - Inputs: article id and the data from the Article function
* - Outputs: the data added to the table, console.log of data returned from AJAX call
*/
Article.prototype.updateRecord = function(callback) {
  // DONE: AJAX call accessing at the particular articles id and updating the data listed below into the table
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // TODO: this is giving the properties of the instance to be updated in the table
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
  // DONE: This is indicating that after the above is inputted into the table then log the data added and if the callback function is there, run the callback function
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};
