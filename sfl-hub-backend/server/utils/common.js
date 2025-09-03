

import moment from 'moment';


const formatRateDate = function (date) {
  var dateformat =
    moment(date).format("hh:mm:ss a") == "12:00:00 am"
      ? moment(date).format("MM/DD/YYYY")
      : date;
  return dateformat;
};

const currentDateTimeFormat = function () {
  return moment().format("YYYY-MM-DD HH:mm:ss");
};

const isEmpty = (value) => {
  return value === undefined || value === null || value === '';
};


// -------------------------   GMT END ---------------
export  {formatRateDate,currentDateTimeFormat, isEmpty};
