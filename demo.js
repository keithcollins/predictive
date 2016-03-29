var predictive = require('./predictive');

var options = {
  files: [
    "text/seinfeld.txt",
    "text/got.txt",
  ],
  lines_to_output: 10,
  sentences_per_line: 2,
  select_next: "random"
}

predictive.generate(options,function(text){
  console.log(text);
});