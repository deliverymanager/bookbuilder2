var fs = require("fs");
var xml2js = require("xml2js");
var _ = require("underscore");
const writeJsonFile = require('write-json-file');

var parser = new xml2js.Parser();
fs.readFile(__dirname + '/techVocabulary.xml', function (err, data) {
  parser.parseString(data, function (err, result) {

    result = result["TechItEasy1"]["lesson"];

    _.each(result, function (lesson, key, list) {

      result[key].lessonNumber = lesson["$"].lessonNumber;
      delete result[key]["$"];

      _.each(result[key].word, function (word, w, lw) {

        result[key].word[w] = {
          lessonNumber: lesson.lessonNumber,
          order: word.wordOrder[0],
          english: word.wordEnglish[0],
          greek: word.wordGreek[0],
          example: word.wordExample[0],
          audio: word.wordAudio[0]
        };
      });

      _.each(result[key].generalWord, function (generalWord, w, lw) {

        result[key].word.push({
          lessonNumber: lesson.lessonNumber,
          order: generalWord.generalWordOrder[0],
          english: generalWord.generalWordEnglish[0],
          greek: generalWord.generalWordGreek[0],
          example: generalWord.generalWordExample[0],
          audio: generalWord.generalWordAudio[0]
        });
      });
      _.each(result[key].phrase, function (phrase, w, lw) {

        result[key].phrase[w] = {
          lessonNumber: lesson.lessonNumber,
          order: phrase.phraseWordOrder[0],
          english: phrase.phraseEnglish[0],
          greek: phrase.phraseGreek[0],
          example: phrase.phraseExample[0],
          audio: phrase.phraseAudio[0]
        };

      });

    });

    var lessons = {};
    _.each(result, function (lesson, key, list) {

      lesson.word = _.filter(lesson.word, function (word) {
        return word.order !== "*";
      });

      lesson.phrase = _.filter(lesson.phrase, function (phrase) {
        return phrase.order !== "*";
      });

      lessons["lesson" + lesson.lessonNumber] = {
        "word": lesson.word,
        "phrase": lesson.phrase
      }
    });

    writeJsonFile(__dirname + '/techVocabulary.json', lessons).then(function () {
      console.log("techVocabulary.xml edited!");
    });
  });
});
