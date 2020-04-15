const paginate = (array, page = paginate.DEFAULT_PAGE, count = paginate.DEFAULT_COUNT) => {
  return array.slice((page - 1) * count, (page - 1) * count + count);
};

paginate.DEFAULT_PAGE = 1;
paginate.DEFAULT_COUNT = 5;

module.exports.paginate = paginate;
