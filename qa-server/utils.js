const paginate = (array, page = paginate.DEFAULT_PAGE, count = paginate.DEFAULT_COUNT) => {
  return array.slice(page * count, page * count + count);
};

paginate.DEFAULT_PAGE = 0;
paginate.DEFAULT_COUNT = 5;

module.exports.paginate = paginate;
