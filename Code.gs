/**
 * A Google App Script to manage Animal Crossing New Horizon's Stalk Market predictions
 * 
 * Logic stolen from Mike Bryant's excellent webapp translation of Treeki's reverse engineering of the Animal Crossing source code
 * 
 * @author Matthew Conto <https://github.com/drfuzzyness>
 * @author Jeffery Hu <https://github.com/jyh947>
 * @author Jonathan Ames
 */

// Which sheets shouldn't be updated
const BLACKLISTED_SHEET_NAMES = ["Overview", "Summary", "Read Me", "Talk", "Testing"];

// Algorithmic constants
const START_ROW_OF_RESULTS_TABLE = 14;
const MAX_NUM_OF_ENTRIES = 72;
const NUM_OF_COLUMNS = 25;
const USER_PRICE_ENTRY_RANGE = "B2:C8";

function minimumRateFromGivenAndBase(given_price, buy_price) {
  return (given_price - 0.5) / buy_price;
}

function maximumRateFromGivenAndBase(given_price, buy_price) {
  return (given_price + 0.5) / buy_price;
}

/**
 * 
 * @param {Array<number>} given_prices 
 * @param {*} high_phase_1_len 
 * @param {*} dec_phase_1_len 
 * @param {*} high_phase_2_len 
 * @param {*} dec_phase_2_len 
 * @param {*} high_phase_3_len 
 * 
 * @returns {Object} Single prediction
 */
function generatePatternZeroWithLengths(given_prices, high_phase_1_len, dec_phase_1_len, high_phase_2_len, dec_phase_2_len, high_phase_3_len) {

  const buy_price = given_prices[0];
  let predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  // High Phase 1
  for (let i = 2; i < 2 + high_phase_1_len; i++) {
    min_pred = Math.ceil(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // Dec Phase 1
  let min_rate = 0.6;
  let max_rate = 0.8;
  for (let i = 2 + high_phase_1_len; i < 2 + high_phase_1_len + dec_phase_1_len; i++) {
    min_pred = Math.ceil(min_rate * buy_price);
    max_pred = Math.ceil(max_rate * buy_price);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
      max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 0.1;
    max_rate -= 0.04;
  }

  // High Phase 2
  for (let i = 2 + high_phase_1_len + dec_phase_1_len; i < 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len; i++) {
    min_pred = Math.ceil(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // Dec Phase 2
  min_rate = 0.6;
  max_rate = 0.8;
  for (let i = 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len; i < 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len; i++) {
    min_pred = Math.ceil(min_rate * buy_price);
    max_pred = Math.ceil(max_rate * buy_price);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
      max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 0.1;
    max_rate -= 0.04;
  }

  // High Phase 3
  if (2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len + high_phase_3_len != 14) {
    throw new Error("Phase lengths don't add up");
  }
  for (let i = 2 + high_phase_1_len + dec_phase_1_len + high_phase_2_len + dec_phase_2_len; i < 14; i++) {
    min_pred = Math.ceil(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }
  return {
    pattern_description: "high, decreasing, high, decreasing, high",
    pattern_number: 0,
    prices: predicted_prices
  };
}

/**
 * 
 * @param {Array<number>} given_prices 
 */
function generatePatternZero(given_prices) {

  let predictions = [];

  for (let dec_phase_1_len = 2; dec_phase_1_len < 4; dec_phase_1_len++) {
    for (let high_phase_1_len = 0; high_phase_1_len < 7; high_phase_1_len++) {
      for (let high_phase_3_len = 0; high_phase_3_len < (7 - high_phase_1_len - 1 + 1); high_phase_3_len++) {
        
        const prediction = generatePatternZeroWithLengths(given_prices, high_phase_1_len, dec_phase_1_len, 7 - high_phase_1_len - high_phase_3_len, 5 - dec_phase_1_len, high_phase_3_len);
        
        if (prediction !== undefined) {
          predictions.push(prediction);
        }
      }
    }
  }

  return predictions;
}

/**
 * 
 * @param {Array<number>} given_prices 
 * @param {number} peak_start The index of where the peak theoretically starts
 * 
 * @returns {Object} A single prediction for a pattern
 */
function generatePatternOneWithPeak(given_prices, peak_start) {

  buy_price = given_prices[0];
  let predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  let min_rate = 0.85;
  let max_rate = 0.9;

  for (let i = 2; i < peak_start; i++) {
    min_pred = Math.ceil(min_rate * buy_price);
    max_pred = Math.ceil(max_rate * buy_price);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
      max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 0.05;
    max_rate -= 0.03;
  }

  // Now each day is independent of next
  min_randoms = [0.9, 1.4, 2.0, 1.4, 0.9, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4]
  max_randoms = [1.4, 2.0, 6.0, 2.0, 1.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]
  for (let i = peak_start; i < 14; i++) {
    min_pred = Math.ceil(min_randoms[i - peak_start] * buy_price);
    max_pred = Math.ceil(max_randoms[i - peak_start] * buy_price);

    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }
  return {
    pattern_description: "decreasing, high spike, random lows",
    pattern_number: 1,
    prices: predicted_prices
  };
}

function generatePatternOne(given_prices) {
  let possibilities = [];

  for (let peak_start = 3; peak_start < 10; peak_start++) {
    const prediction = generatePatternOneWithPeak(given_prices, peak_start);
    if (prediction !== undefined) {
      possibilities.push(prediction);
    }
  }

  return possibilities;
}

function generatePatternTwo(given_prices) {

  buy_price = given_prices[0];
  let predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  let min_rate = 0.85;
  let max_rate = 0.9;
  for (let i = 2; i < 14; i++) {
    min_pred = Math.ceil(min_rate * buy_price);
    max_pred = Math.ceil(max_rate * buy_price);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
      max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 0.05;
    max_rate -= 0.03;
  }

  return [{
    pattern_description: "always decreasing",
    pattern_number: 2,
    prices: predicted_prices
  }];
}

/**
 * Generates a single possibility for a pattern
 * 
 * @param {Array<number>} given_prices 
 * @param {number} peak_start The index of where the peak theoretically starts
 */
function generatePatternThreeWithPeak(given_prices, peak_start) {

  buy_price = given_prices[0];
  let predicted_prices = [
    {
      min: buy_price,
      max: buy_price,
    },
    {
      min: buy_price,
      max: buy_price,
    },
  ];

  let min_rate = 0.4;
  let max_rate = 0.9;

  for (let i = 2; i < peak_start; i++) {
    min_pred = Math.ceil(min_rate * buy_price);
    max_pred = Math.ceil(max_rate * buy_price);


    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
      min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
      max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });

    min_rate -= 0.05;
    max_rate -= 0.03;
  }

  // The peak

  for (let i = peak_start; i < peak_start + 2; i++) {
    min_pred = Math.ceil(0.9 * buy_price);
    max_pred = Math.ceil(1.4 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  // TODO this could be made more accurate, I've not bothered with the -1s, or forward/backward calculating of the rate each side of the peak value
  for (let i = peak_start + 2; i < peak_start + 5; i++) {
    min_pred = Math.ceil(1.4 * buy_price);
    max_pred = Math.ceil(2.0 * buy_price);
    if (!isNaN(given_prices[i])) {
      if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
        // Given price is out of predicted range, so this is the wrong pattern
        return;
      }
      min_pred = given_prices[i];
      max_pred = given_prices[i];
    }

    predicted_prices.push({
      min: min_pred,
      max: max_pred,
    });
  }

  if (peak_start + 5 < 14) {
    let min_rate = 0.4;
    let max_rate = 0.9;

    for (let i = peak_start + 5; i < 14; i++) {
      min_pred = Math.ceil(min_rate * buy_price);
      max_pred = Math.ceil(max_rate * buy_price);


      if (!isNaN(given_prices[i])) {
        if (given_prices[i] < min_pred || given_prices[i] > max_pred) {
          // Given price is out of predicted range, so this is the wrong pattern
          return;
        }
        min_pred = given_prices[i];
        max_pred = given_prices[i];
        min_rate = minimumRateFromGivenAndBase(given_prices[i], buy_price);
        max_rate = maximumRateFromGivenAndBase(given_prices[i], buy_price);
      }

      predicted_prices.push({
        min: min_pred,
        max: max_pred,
      });

      min_rate -= 0.05;
      max_rate -= 0.03;
    }
  }

  return {
    pattern_description: "decreasing, spike, decreasing",
    pattern_number: 3,
    prices: predicted_prices
  };
}

/**
 * 
 * @param {Array<number>} given_prices 
 */
function generatePatternThree(given_prices) {
  let possibilities = [];

  for (let peak_start = 2; peak_start < 10; peak_start++) {
    const prediction = generatePatternThreeWithPeak(given_prices, peak_start);
    if (prediction !== undefined) {
      possibilities.push(prediction);
    }
  }

  return possibilities;
}

/**
 * 
 * @param {Array<number>} sell_prices The input prices from the user
 */
function generatePossibilities(sell_prices) {
  let possibilities = [];

  possibilities = possibilities.concat(
    generatePatternZero(sell_prices),
    generatePatternOne(sell_prices),
    generatePatternTwo(sell_prices),
    generatePatternThree(sell_prices)
  );

  return possibilities;
}

function parseAmPmPriceRange(price_array, offset_x, offset_y)
{
  let buy_price;
  
  if(price_array[0][0] === undefined && price_array[0][1] === undefined)
  {
    return [];
  }
  else if(price_array[0][0] !== undefined)
  {
    buy_price = Number(price_array[0][0]);
  }
  else if(price_array[0][1] !== undefined)
  {
    buy_price = Number(price_array[0][1]);
  }
  else
  {
    // Error, no buy price specified!
    return [];
  }
  
  let sell_prices = [buy_price, buy_price];
  for(let x = offset_x; x < price_array.length; x++)
  {
    for(let y = offset_y; y < price_array[x].length; y++)
    {
      if(price_array[x][y] === undefined || price_array[x][y] == 0)
      {
        sell_prices.push(undefined);
      }
      else
      {
        sell_prices.push(Number(price_array[x][y]));
      }
    }
  }
  
  return sell_prices;
}

function writePredictionsToSheet(predictions_array, sheet, startRow)
{
  // Create 2D array
  let table_grid = [];
  
  for(const prediction of predictions_array)
  {
    if(prediction !== undefined)
    {
      let row = [];
      row.push(prediction.pattern_description);
      
      for(let i = 2; i < prediction.prices.length; i++)
      {
        const price = prediction.prices[i];
        row.push(price.min);
        row.push(price.max);
      }
      
      table_grid.push(row);
    }
  }
  
  // Write 2D array if there are entries to write
  if(table_grid.length > 0 && table_grid[0].length > 0)
  {
    const numRows = table_grid.length;
    
    sheet.getRange(startRow, 1, numRows, NUM_OF_COLUMNS).setValues(table_grid);
  }
}

function updateSheet(sheet)
{
  // Clear previous contents
  
  sheet.getRange(START_ROW_OF_RESULTS_TABLE, 1, MAX_NUM_OF_ENTRIES, NUM_OF_COLUMNS).clear({contentsOnly: true});
  
  const price_array = sheet.getRange("B2:C8").getValues();
  const parsed_prices = parseAmPmPriceRange(price_array, 1, 0);
  
  const probabilities = generatePossibilities(parsed_prices);
  writePredictionsToSheet(probabilities, sheet, START_ROW_OF_RESULTS_TABLE);
  
}

function onEdit(edit)
{
  const sheet = edit.range.getSheet();
  const sheetName = sheet.getName();
  
  for(let i = 0; i < BLACKLISTED_SHEET_NAMES.length; i++)
  {
    if(sheetName == BLACKLISTED_SHEET_NAMES[i])
    {
      // Skip this item if it's blacklisted
      return;
    }
  }
  
  updateSheet(sheet);
}

function priceTest()
{
  let fake_sell_prices = [109, 109, 91, 87, 84, 80];
  const possibilities = generatePossibilities(fake_sell_prices);
  console.log(possibilities.length);
  console.log(possibilities);
}

function sheetTest()
{
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Testing");
  const price_array = sheet.getRange(USER_PRICE_ENTRY_RANGE).getValues();
  const parsed_prices = parseAmPmPriceRange(price_array, 1, 0);
  Logger.log(parsed_prices);
  const probabilities = generatePossibilities(parsed_prices);
  writePredictionsToSheet(probabilities, sheet, START_ROW_OF_RESULTS_TABLE);
}