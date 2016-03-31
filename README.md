# predictive
Simple library for generating predictive, ebooks-esque text using word pairs. This began as a rewrite of [nodeEbot](https://github.com/daveschumaker/nodeEbot), but dropped and added enough features to become its own thing.

Add to your project's `package.json` or install with `npm install predictive`

Play around with the options below in `demo.js` and run by typing `node demo`.

### You could use it to make tweets:

```js
var predictive = require('predictive');

var options = {
  files: [
    "path/to/text1.txt",
    "path/to/text2.txt"
  ],
  break_text_on: "\n",
  lines_to_output: 1,
  characters_per_line: 140,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});
```

Sample output, using Seinfeld and Game of Thrones scripts as text inputs (see `examples` folder):

```
JORAH: Ser Jorah Mormont of Bear Island. I served your father from his chess board.
```

### Or something bigger:

```js
var predictive = require('predictive');

var options = {
  files: [
    "path/to/text1.txt",
    "path/to/text2.txt"
  ],
  break_text_on: "\n",
  lines_to_output: 10,
  sentences_per_line: 3,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});
```

Sample output, again using Seinfeld and Game of Thrones scripts as text inputs:

```
GEORGE: Why couldn't you have to help us here in New York Health Club]
RAMSAY: Why? Winterfell is yours.
SEPTA MORDANE: Enough!
EXT. SANSA’S ROOM - MORNING
ELAINE: No, you don't wear the ribbon. We are travelling together. In each other’s company.
SPARROW: A sinner comes before you with a squad of guardsmen to escort you to start a marriage. We are the lords of small matters here.
ELAINE: It isn't?
JERRY: But see look at them..
PHARMACIST: Did you make it up. That is why it is still laughing)
THEON: I’ve come to meet?
```

### Here are all the options

| Option               | Type            | Required                 | Default         | Description  |
| -------------------- |:---------------:|:------------------------:|:---------------:|:-------------|
| `files`              | Array           | Yes                      | `null`          | The relative path to the text to input. Supports txt (recommended), csv and json. I haven't done much testing with csv or json. Should work though! Let me know.
| `break_text_on`      | String          | For txt file(s)          | `"\n"`          | For an efficient and robust corpus, input text needs to be broken up into discrete lines. If you're inputting text with no line breaks, consider using punctuation here.
| `csv_field`          | String          | For csv file(s)          | `0`             | The field in your csv file from which text should be ingested.
| `json_field`         | String          | For json file(s)         | `0`             | The field in your json file from which text should be ingested. Your json input should probably be flat. 
| `lines_to_output`    | Integer         | -                        | `10`            | Number of lines of generated text to output. Line breaks will be appended to outputted text.
| `characters_per_line`| Integer         | -                        | `-1` (no limit) | Limit the number of characters for each line. Will often cutoff sentences at weird places.
| `words_per_line`     | Integer         | -                        | `-1` (no limit) | Limit the number of words for each line. Will often cutoff sentences at weird places.
| `sentences_per_line` | Integer         | -                        | `-1` (no limit) | Number of sentences for each line. Sentences will be terminated by defined punctuation (see below).
| `punctuation`        | Array           | -                        | `[".","!","?"]` | Which characters should denote the end of a sentence.
| `startwords`         | Array           | -                        | -               | An array of words to start each generated sentence with. Must be words that exist in corpus. If not defined, `predictive` will use the first word on each sentence in corpus.
| `select_next`        | String          | -                        | `"random"`      | Method to use for selecting the next word in sentence generation. See options below.


### `select_next` options:

`"random"` (recommended) during line generation, selects the next word from an array of relevant word pairs at random.

`"most_frequent"` during line generation, selects the next word from an array of relevant word pairs by the word that occurs most frequently after current one.

`"least_frequent"` during line generation, selects the next word from an array of relevant word pairs by the word that occurs least frequently after current one.
