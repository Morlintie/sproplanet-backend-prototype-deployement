const pitchTax = (amount) => {
  return (amount * 18) / 100;
};

const middlemanTax = (amount) => {
  return (amount * 18) / 100;
};

module.exports = {
  pitchTax,
  middlemanTax,
};
