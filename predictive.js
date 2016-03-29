var fs = require('fs');
var path = require('path');
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

  // Do text generation and send output to callback
  // @param options Object
  // @param callback Function
  generate: function(options,callback) {
    var self = this;
    var params = Object.keys(options);
    params.forEach(function(param){
      if (options[param]) self[param] = options[param];
    });
    this.ingest(options.files,function(collection){
      self.startwords = (options.startwords) ? options.startwords : collection.startwords;
      self.input_lines = collection.input_lines;
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

  // Ingest lines and startwords from raw file inputs
  // @param files Array
  // @param callback Function
  ingest: function(files,callback) {
    var self = this;
    var collection = {input_lines:[],startwords:[]};
    files.forEach(function(file){
      var filepath = path.join(__dirname, file);
      var raw = fs.readFileSync(filepath, 'utf8');
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
    callback(collection);
  },

  // Break inputted lines into word pairs
  // @param input_lines Array
  // @param callback Function
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

  // Determine next word(s) to add to current line
  // @param first_word String
  // @param second_word String
  // @return String
  get_next_word: function(first_word,second_word) {
    // Note: first_word and second_word are last two words of current line

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

  // Create a line
  // @return String
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

  // Check a file extension
  // @param filename String
  // @return String
  get_file_type: function(filename) {
    return filename.split(".")[filename.split(".").length-1];
  },

  // Should line stop collecting words?
  // @param line String
  // @return Boolean
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

  // Is line exact match of any line in corpus?
  // @param line String
  // @return Boolean
  is_verbatim: function(line) {
    var b = false;
    if (this.input_lines.indexOf(line) > -1) {
      b = true;
    }
    return b;
  }

};

module.exports = predictive;