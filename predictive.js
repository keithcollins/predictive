var fs = require('fs');
var d3 = require('d3');

var predictive = {
  wordpairs: [],
  startwords: [],
  lines_to_output: 10,
  characters_per_line: -1,
  sentences_per_line: -1,
  words_per_line: -1,
  punctuation: [".","!","?"],
  break_text_on: "\n",
  json_field: 0,
  csv_field: 0,
  select_next: "random",
  filter_stopwords: false,

  /**
   * Do text generation and send output to callback
   *
   * @param {Object} options - User-defined options.
   * @param {callback1} callback - Send generated text, string.
   */
  generate: function(options,callback) {
    var self = this;
    var params = Object.keys(options);
    params.forEach(function(param){
      if (options[param]) self[param] = options[param];
    });
    this.ingest(options.files,function(collection){
      self.startwords = (options.startwords) ? options.startwords : collection.startwords;
      self.input_lines = self.clean_text(collection.input_lines);
      self.build_corpus(self.input_lines,function(pairs){
        self.wordpairs = pairs;
        var output = [];
        var new_line;
        while (new_line = self.create_line()) {
          output.push(new_line);
          if (output.length == self.lines_to_output) break;
        }
        callback(output.join("\n"));
      });
    });
  },

  /**
   * Ingest lines and startwords from raw file inputs
   *
   * @param {Array} files - Array of paths to input files.
   * @param {callback2} callback - Send ingested collection, object with two arrays.
   * @todo impement stopword filtering.
   */
  ingest: function(files,callback) {
    var self = this;
    var collection = {input_lines:[],startwords:[]};
    files.forEach(function(file){
      var raw = fs.readFileSync(file, 'utf8');
      switch(self.get_file_type(file)) {
        case "txt":
          raw.split(self.break_text_on).forEach(function(d){
            collection.input_lines.push(d);
            collection.startwords.push(d.split(" ")[0]);
          });
          break;
        case "json":
          JSON.parse(raw).forEach(function(d){
            collection.input_lines.push(d[self.json_field]);
            collection.startwords.push(d[self.json_field].split(" ")[0]);
          });
          break;
        case "csv":
          d3.csv.parse(raw).forEach(function(d){
            collection.input_lines.push(d[self.csv_field]);
            collection.startwords.push(d[self.csv_field].split(" ")[0]);
          });
          break;
      }
    });
    
    // todo: implement stopword filtering
    if (this.filter_stopwords) {
      var filtered_lines = [];
      collection.input_lines.forEach(function(line){
        var filtered_line = [];
        line.split(" ").forEach(function(word){
          if (wordbank.stopwords.indexOf(word) === -1) {
            filtered_line.push(word);
          }
        });
        filtered_lines.push(filtered_line.join(" "));
      });
      collection.input_lines = filtered_lines;
    }

    callback(collection);
  },

  /**
   * Break inputted lines into word pairs
   *
   * @param {Array} input_lines - Array of inputted sentences.
   * @param {callback3} callback - Send resulting wordparis, array of objects.
   */
  build_corpus: function(input_lines,callback) {
    var wordpairs = [];
    input_lines.forEach(function(line,l){
      var line_words = line.split(" ");
      line_words.forEach(function(word,i){
        if (word) {
          var next_word = (line_words[i+1]) ? line_words[i+1] : null;
          var prev_word = (line_words[i-1]) ? line_words[i-1] : null;
          var next_next_word = (line_words[i+2]) ? line_words[i+2] : null;
          if (next_word && next_next_word) {
            var wordpair = {
              first_word: word,
              word_pair: word+' '+next_word,
              word_pair_array: [word, next_word],
              next_word: next_word,
              next_next_word: next_next_word,
              prev_word: prev_word,
              position: i
            };
            wordpairs.push(wordpair);
          }
        }
      });
    });
    callback(wordpairs);
  },

  /**
   * Determine next word(s) to add to current sentence
   *
   * @param {string} first_word - Second to last word in current sentence.
   * @param {string} second_word - Last word in current sentence.
   * @returns {string} - New word to be added to sentence.
   */
  get_next_word: function(first_word,second_word) {
    
    // search by first_word prop if we only have one word
    // that means it's the first word in new sentence
    var property = 'first_word',
      value = first_word,
      sort_by = "next_word",
      result;

    // otherwise search by word_pair
    if (first_word && second_word) {
      property = 'word_pair';
      value = first_word+" "+second_word;
      sort_by = "next_next_word";
    }
    
    // do search
    var results = this.wordpairs.filter(function(obj) {
      return obj[property] == value;
    });

    // nest resulting objects by next_next_word
    var by_next_next = d3.nest()
      .key(function(d) { return d[sort_by]; })
      .map(results);

    // select random next word from results
    if (this.select_next == "random") {
      result = results[Math.floor(Math.random() * results.length)];
    
    // select the most frequent word to come after current one
    } else if (this.select_next == "most_frequent") {
      result = results.sort(function(a,b){
        var nexta = by_next_next[a[sort_by]].length;
        var nextb = by_next_next[b[sort_by]].length;
        return nextb - nexta; 
      })[0];
    
    // select the *least* frequent word to come after current one
    } else if (this.select_next == "least_frequent") {
      result = results.sort(function(a,b){
        var nexta = by_next_next[a[sort_by]].length;
        var nextb = by_next_next[b[sort_by]].length;
        return nexta - nextb; 
      })[0];
    }
    if (!result) return {error:"end"};
    return result;
  },

  /**
   * Create a line
   *
   * @returns {string} - New sentence to be added to output.
   */
  create_line: function() {
    var new_words;

    // choose start_word at random
    var start_word = this.startwords[Math.floor(Math.random() * this.startwords.length)];
    
    // get first two words by searching wordpairs for first_word = startWord
    var line = [start_word];
    var initial_words = this.get_next_word(start_word,null);
    line.push(initial_words.next_word);
    line.push(initial_words.next_next_word);

    // keep getting next_next_word until not
    while (new_words = this.get_next_word(line[line.length-2],line[line.length-1])) {
      if (new_words.error === 'end') break;
      line.push(new_words.next_next_word);
      if (this.is_end(line.join(" "))) {
        if (!this.is_verbatim(line)) {
          break;
        } else {
          line = [start_word];
        }
      }
    }
    return line.join(" ");
  },

  /**
   * Decode HTML entities
   *
   * @param {string} str
   * @returns {string} - Clean string
   */
  decode_html: function(str) {
    return str.replace(/&#(\d+);/g, function(match, dec) {
      return String.fromCharCode(dec);
    });
  },

  /**
   * Clean up text and replace unicode
   *
   * @param {Array} input_lines - Array of inputted sentences.
   * @returns {Array} - Array of cleaned sentences
   */
  clean_text: function(input_lines) {
    var self = this;
    var cleaned_lines = [];
    input_lines.forEach(function(line){
      var str = self.decode_html(line).toString()
        .replace(/(“|”|’)/g, function ($0){
          var index = {
            '“': '"',
            '”': '"',
            '’': "'"
          };
          return index[$0] != undefined ? index[$0] : $0;
        });
      cleaned_lines.push(str);
    });
    return cleaned_lines;
  },

  /**
   * Get file extension
   *
   * @param {string} filename - A filename with an extension.
   * @returns {string} - Just the extension.
   */
  get_file_type: function(filename) {
    return filename.split(".")[filename.split(".").length-1];
  },

  /**
   * Should sentence stop collecting words?
   *
   * @param {string} line - Current sentence.
   * @returns {Boolean}
   */
  is_end: function(line) {
    var self = this;
    var b = false;

    // by characters per line
    if (this.characters_per_line > -1 && line.length >= this.characters_per_line) {
      b = true;
    }

    // by words per line
    if (this.words_per_line > -1 && line.split(" ").length >= this.words_per_line) {
      b = true;
    }

    // by sentences per line
    // there are reasons for not using regexp
    var end_count = 0;
    line.split("").forEach(function(c){
      end_count += (self.punctuation.indexOf(c) > -1) ? 1 : 0;
    });

    if (this.sentences_per_line > -1 && end_count >= this.sentences_per_line) {
      b = true;
    }

    return b;
  },

  /**
   * Is line exact match of any line in corpus?
   *
   * @param {string} line - Current sentence.
   * @returns {Boolean}
   */
  is_verbatim: function(line) {
    var b = false;
    if (this.input_lines.indexOf(line) > -1) {
      b = true;
    }
    return b;
  }

};

module.exports = predictive;