# predictive
Simple library for generating "predictive," ebooks-esque text using word pairs. This began as a rewrite of [nodeEbot](https://github.com/daveschumaker/nodeEbot), but dropped and added enough features to become its own thing.

Play around with the options below in `demo.js` and run by typing `node demo`. This will use the included Seinfeld and Game of Thrones texts as a corpus.

### You could use it to make tweets:

```js
var predictive = require('./predictive');

var options = {
  files: [
    "text/seinfeld.txt",
    "text/got.txt",
  ],
  lines_to_output: 1,
  characters_per_line: 2,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});
```

Sample output:
```
JORAH: Ser Jorah Mormont of Bear Island. I served your father from his chess board.
```

### Or something bigger:

```js
var predictive = require('./predictive');

var options = {
  files: [
    "text/seinfeld.txt",
    "text/got.txt",
  ],
  lines_to_output: 10,
  sentences_per_line: 3,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});
```

Sample output:

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

`files` Array (required)

The relative path to the text to input. Supports txt (recommended), csv and json. I haven't done much testing with csv or json. Should work though! Let me know.

`break_text_on` String (required if you're inputting txt file(s))
Default: `"\n"`

For an efficient and robust corpus, input text needs to be broken up into discrete lines. If you're inputting text with no line breaks, consider using punctuation here.

`csv_field` String (required if you're inputting json file(s))

Default: `0`

The field in your csv file from which text should be ingested.

`json_field` String (required if you're inputting json file(s))

Default: `0`

The field in your json file from which text should be ingested. Your json input should probably be flat. 

`lines_to_output` Integer

Default: `10`

Number of lines of generated text to output. Line breaks will be appended to outputted text.

`characters_per_line` Integer

Default: `-1` (which means no limit)

Limit the number of characters for each line. Will often cutoff sentences at weird places.

`words_per_line`  Integer

Default: `-1` (which means no limit)

Limit the number of words for each line. Will often cutoff sentences at weird places.

`sentences_per_line`  Integer

Default: `-1` (which means no limit)

Number of lines of sentences for each line. Sentences will be terminated by defined punctuation (see below).

`punctuation` Array

Default: `[".","!","?"],`

Which characters should denote the end of a sentence.

`select_next` String

Default: `"random"`

Options:

`"random"` (recommended) during line generation, selects the next word from an array of relevant word pairs at random.

`"most_frequent"` during line generation, selects the next word from an array of relevant word pairs by the word that occurs most frequently after current one.

`"least_frequent"` during line generation, selects the next word from an array of relevant word pairs by the word that occurs least frequently after current one.
