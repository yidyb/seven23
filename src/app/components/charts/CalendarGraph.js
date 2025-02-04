import './CalendarGraph.scss';

import moment from "moment";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import { useD3 } from '../../hooks/useD3';
import { useTheme } from '@mui/material/styles';

import ClickAwayListener from '@mui/material/ClickAwayListener';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';

import { amountWithCurrencyToString } from "../../utils/currency";

const DELAY_MOUSE_HOVER = 400;
const DELAY_TAP = 140;

export default function CalendarGraph({ values, isLoading, color, quantile=0.90, onClick, monthsPerLine }) {

  const theme = useTheme();
  const [animateLoading, setAnimateLoading] = useState(Boolean(isLoading));
  const selectedCurrency = useSelector((state) =>
    state.currencies.find((c) => c.id == state.account.currency)
  );
  const [primaryColor, setPrimaryColor] = useState(color || theme.palette.primary.main);
  const [array, setArray] = useState(values || []);
  const [listeners, setListeners] = useState([]);

  const [timer] = useState([]);

  // Used to disable random click event on touch with iPhone
  let [isTouching] = useState(false);

  const optimizedResize = () => {
    for (let i = 0; i< timer.length; i++) {
      clearTimeout(timer.pop());
    }

    timer.push(setTimeout(() => {
      draw(d3.select(myRef.current));
    }, 100));
  };

  let myRef = useD3(
    (refCurrent) => {
      if ((array && array.length)) {
        if (myRef.current && myRef.current.offsetWidth === 0) {
          setTimeout(() => draw(refCurrent), 200);
        } else {
          draw(refCurrent);
        }
      } else {
        if (animateLoading) {
          draw(refCurrent);
        } else {
          refCurrent.selectAll("g").remove();
        }
      }

      for (let i = 0; i< listeners.length; i++) {
        window.removeEventListener("optimizedResize", listeners[i], false);
      }
      listeners.push(optimizedResize);
      window.addEventListener("optimizedResize", optimizedResize);
    },
    [array, animateLoading]
  );

  useEffect(() => {
    return () => {
      for (let i = 0; i< listeners.length; i++) {
        window.removeEventListener("optimizedResize", listeners[i], false);
      }
    };
  }, []);

  useEffect(() => {
    if (values && values.length != array.length) {
      setArray(values);
    } else if (values && !array.every((element, index) => element.date == values[index].date)) {
      setArray(values);
    }
  }, [values]);

  useEffect(() => {
    setAnimateLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setPrimaryColor(color || theme.palette.primary.main);
  }, [color, theme.palette.primary.main]);

  const draw = (_svg) => {
    try {
      // Somehow call calendar
      _svg.selectAll("g").remove();
      if (array || animateLoading) {
        let weeksCounter = 0;
        if (array && array.length) {
          weeksCounter = Math.min(moment.duration(moment(array[array.length - 1].date).diff(moment(array[0].date))).as('weeks'), 52);
        }
        Calendar(_svg, array, {
          x: value => value.date,
          y: value => value.amount,
          width: +_svg._groups[0][0].parentNode.clientWidth,
          cellSize: Math.min(52 * 10 / weeksCounter, 10), // if 52 then 10.
          colors: d3.interpolateRgb.gamma(2.2)(d3.color(`${primaryColor}`), d3.color(`${primaryColor}20`))
        });
      }

    } catch (error) {
      // Handle exception on crash after #82
      console.error(error);
    }
  };

  // Copyright 2021 Observable, Inc.
  // Released under the ISC license.
  // https://observablehq.com/@d3/calendar-view
  function Calendar(_svg, values = [], {
    x = ([x]) => x, // given d in data, returns the (temporal) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    title, // given d in data, returns the title text
    width = 925, // width of the chart, in pixels
    cellSize = 17, // width and height of an individual day, in pixels
    weekday = "monday", // either: weekday, sunday, or monday
    formatDay = i => "SMTWTFS"[i], // given a day number in [0, 6], the day-of-week label
    formatMonth = "%b", // format specifier string for months (above the chart)
    yFormat, // format specifier string for values (in the title)
    colors = d3.interpolatePiYG
  } = {}) {
    const data = [...values];

    let monthPerLine = 12;
    if (monthsPerLine) {
      monthPerLine = monthsPerLine;
    } else {
      if (width < 800) {
        monthPerLine = 6;
      }
      if (width < 400) {
        monthPerLine = 4;
      }
    }

    if (monthPerLine < 12) {
      const numberOfWeek = 52 / (12 / monthPerLine);
      cellSize = (width * 0.8 - 20) / (numberOfWeek - 1);
    }

    if (animateLoading && data.length === 0) {
      let i = moment().utc().endOf('month').toDate().getTime();
      const until = moment().utc().subtract(monthPerLine-1, 'months').startOf('month').toDate().getTime();
      while (i >= until) {
        // Generate zero amount for each days of the first row
        data.push({
          date: new Date(i),
          amount: 0,
        });
        i = i - (1000*60*60*24);
      }
      data.reverse();
    }

    let isOneLineCalendar = false;
    const duration_in_month = moment.duration(moment(data[data.length - 1].date).diff(moment(data[0].date))).as('months')
    if (duration_in_month < monthPerLine) {
      isOneLineCalendar = true;
    }


    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);
    const I = d3.range(X.length);

    const countDay = weekday === "sunday" ? i => i : i => (i + 6) % 7;
    const timeWeek = weekday === "sunday" ? d3.utcSunday : d3.utcMonday;
    const weekDays = weekday === "weekday" ? 5 : 7;
    const height = cellSize * (weekDays + 2);

    // Compute a color scale. This assumes a diverging color scheme where the pivot
    // is zero, and we want symmetric difference around zero.
    const max = d3.quantile(Y.filter(t => t != 0), quantile, Math.abs);
    const color = d3.scaleSequential([-max, 0], colors).unknown("none");

    // Construct formats.
    formatMonth = d3.utcFormat(formatMonth);

    // Compute titles.
    if (title === undefined) {
      const formatDate = d3.utcFormat("%B %-d, %Y");
      title = i => `${formatDate(X[i])}\n${amountWithCurrencyToString(Y[i], selectedCurrency)}`;
    } else if (title !== null) {
      const T = d3.map(data, title);
      title = i => T[i];
    }

    // Group the index by year, in reverse input order. (Assuming that the input is
    // chronological, this will show years in reverse chronological order.)
    let years = [];

    const earliest = moment.utc(X[0]);
    const oldest = moment.utc(X[X.length-1]);

    // If monthPerLine is not 12 (because not enough space)
    // we start from older month and cut it to every x month
    if (monthPerLine == 12) {
      years = d3.groups(I, i => `${X[i].getUTCFullYear()}`).reverse();
    } else {
      let month = oldest.month(), // Integer between 0 and 11
          year = oldest.year();

      while (year > earliest.year() || (year == earliest.year() && month >= earliest.month())) {

        const endOf = `${year}${('0'+month).slice(-2)}`;

        month = month - monthPerLine;
        if (month < 0) {
          month = month + 12;
          year = year - 1;
        }

        const startOf = `${year}${('0'+(month == 12 ? 0 : month)).slice(-2)}`;
        const list = []

        // Filter data per stringified date
        data.forEach((x, i) => {
          const date = `${x.date.getFullYear()}${('0'+x.date.getMonth()).slice(-2)}`;
          if (startOf < date && date <= endOf) {
            list.push(i);
          }
        })
        years.push([X[list[0]].getFullYear(), list]);
      }
    }

    // Last row need space to align months with other one
    const date_end_last_row = X[years[years.length-1][1][years[years.length-1][1].length-1]];
    const padding_for_last_row = 
      timeWeek.count(
        moment(date_end_last_row).subtract(monthPerLine, 'months').toDate(), 
        earliest.toDate());


    /* * * * * * * * * * * * * * * * * *
    * MAIN <SVG> CONTAINER
    */

    let first_item = null; // store for eeach loop the first item (date) to compare with current one

    // SVG container
    const svg = _svg //d3.create("svg")
        .attr("width", width)
        .attr("height", height * years.length)
        .attr("viewBox", [0, 0, width, height * years.length])
        .attr("style", "max-width: 100%; min-width: 100%; height: auto; height: intrinsic;")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10);

    // FOR EACH YEAR

    // year container, one line per year
    const year = svg.selectAll("g")
      .data(years)
      .join("g")
        .attr("transform", (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`);

    // Display year value, 2022, 2023
    year.append("text")
        .attr("x", -5)
        .attr("y", -5)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .attr("fill", i => d3.color(theme.palette.text.secondary))
        .text(([key]) => key);

    // Display M, T, W, T, F, S, S for a year
    year.append("g")
        .attr("text-anchor", "end")
      .selectAll("text")
      .data(weekday === "weekday" ? d3.range(1, 6) : d3.range(7))
      .join("text")
        .attr("x", -5)
        .attr("y", i => (countDay(i) + 0.5) * cellSize)
        .attr("dy", "0.31em")
        .text(formatDay)
        .attr("fill", i => d3.color(theme.palette.text.secondary));


    // FOR EACH CELL WITHIN A YEAR
    // Loop for each cell within a year container

    let paddingCell = 0;
    let touchstart;
    const cell = year.append("g")
      .selectAll("rect")
      .data(weekday === "weekday"
          ? ([, I]) => I.filter(i => ![0, 6].includes(X[i].getUTCDay()))
          : ([, I]) => I)
      .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", (i, forloop_counter) => {
          if (forloop_counter == 0) {
            first_item = i;
            if (!isOneLineCalendar && X[i].getTime() == earliest.toDate().getTime()) {
              // Get oldest from last year, compare weeks, apply a remote value
              paddingCell = paddingCell + padding_for_last_row;
            }
          }
          let x = (timeWeek.count(X[first_item], X[i]) + paddingCell) * cellSize + 0.5;
          return x;
        })
        .attr("y", i => countDay(X[i].getUTCDay()) * cellSize + 0.5)
        .attr("fill", i => {
          // We define a lighter color for empty cell
          if (animateLoading) {
            return d3.color(`${theme.palette.divider}`);
          } else if (Y[i] === 0) {
            return d3.color(`${primaryColor}12`);
          }
          return color(Y[i]);
        })
        .style("cursor", onClick && !animateLoading ? "pointer" : "cursor")
        .style("opacity", animateLoading ? "0.5" : "1")
        .attr("data-year", i => X[i].getFullYear())
        .attr("data-month", i => X[i].getMonth())
        .attr("data-date", i => X[i].getDate())
        .attr("data-tooltip", title)
        .on("touchstart", function (event) {
          setIsOpen(false);
          isTouching = true; // setIsTouching() is out of scope from d3.js thread
          touchstart = event.changedTouches[0];
          event.stopPropagation();
        })
        .on("touchend", function (event) {
          const touchend = event.changedTouches[0];
          if (Math.abs(touchstart.pageX - touchend.pageX) < 40 &&
              Math.abs(touchstart.pageY - touchend.pageY) < 40 &&
              onClick &&
              !animateLoading) {
            handleTooltipOpen(event, DELAY_TAP);
          }
          event.preventDefault();
          event.stopPropagation();
        })
        .on("mouseover", function (event) {
          handleTooltipOpen(event, DELAY_MOUSE_HOVER);
          event.preventDefault();
          event.stopPropagation();
        })
        .on("mouseout", function (event) {
          handleTooltipClose(event);
          event.preventDefault();
          event.stopPropagation();
        })
        .on("click", function (event) {
          if (onClick && !isTouching && !animateLoading) {
            onClick(
              event.target.dataset.year,
              event.target.dataset.month,
              event.target.dataset.date
            );
          }
          event.preventDefault();
          event.stopPropagation();
        });

    // FOR EACH MONTH WE DISPLAY LABEL AND LINE
    // Display month related content, aka title and separation.
    const month = year.append("g")
      .selectAll("g")
      .data(([, I]) => d3.utcMonths(d3.utcMonth(X[I[0]]), X[I[I.length - 1]])) // Select month from date[0] until date[end]
      .join("g");

    // Padding to remove
    let toRemoveWeek = 0; // Number of week to remove, betwwen 0 and 52
    // Display large line between month to show separation
    month.filter((d, i) => i).append("path")
        .attr("fill", "none")
        .attr("stroke", d3.color(theme.palette.background.paper)) // "#fff"
        .attr("stroke-width", 3)
        .attr("d", (t, forloop_counter) => {
          // Warning, t is the second month of the year
          if (forloop_counter == 0) {
            first_item = t; // t is a date object with first month
            const from = moment(t).subtract(1, 'month').toDate();
            toRemoveWeek = timeWeek.count(from, t);
            // If ealiest is not first of month, we reajust.
            if (from.getFullYear() == earliest.toDate().getFullYear() &&
                from.getMonth() == earliest.toDate().getMonth()) {
              if (from.getDate() != earliest.toDate().getDate()) {
                toRemoveWeek = timeWeek.count(earliest, t);
              }
              toRemoveWeek = toRemoveWeek + paddingCell;
            }
          }

          const d = Math.max(0, Math.min(weekDays, countDay(t.getUTCDay())));
          let w = timeWeek.count(first_item, t) + toRemoveWeek; // week number, between 0 and 52.
          return `${d === 0 ? `M${w * cellSize},0`
              : d === weekDays ? `M${(w + 1) * cellSize},0`
              : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${weekDays * cellSize}`;
        });

    // Padding to remove
    let toRemove = 0; // Number of pixel to remove, betwek 0 and width
    // Write month in header (janv, feb, march, ...)
    month.append("text")
        .attr("x", (d, forloop_counter) => {
          if (forloop_counter == 0) {
            first_item = d; // d is a date object with first day of the first month
            // If ealiest is not first of month, we reajust.
            if (d.getFullYear() == earliest.toDate().getFullYear() &&
                d.getMonth() == earliest.toDate().getMonth()) {
              toRemove = toRemove + paddingCell;
              if (d.getDate() != earliest.toDate().getDate()) {
                const temporaryToRemove = toRemove;
                toRemove = toRemove - timeWeek.count(d, earliest);
                return (timeWeek.count(first_item, d) + temporaryToRemove) * cellSize + 0.5
              }
            }
          }
          let x = (timeWeek.count(first_item, d) + toRemove) * cellSize + 0.5;
          return x;
        })
        .attr("y", -5)
        .text((d) => {
          // Display month label only if this is false
          if (data && data.length &&
            data[0].date.getFullYear() == d.getFullYear() &&
            data[0].date.getMonth() == d.getMonth() &&
            data[0].date.getDate() > 1) {
            return '';
          } else {
            return formatMonth(d);
          }
        })
        .attr("fill", i => d3.color(theme.palette.text.secondary));

    return Object.assign(svg.node(), {scales: {color}});
  }

  const popperRef = useRef(null);
  const [textContent, setTextContent] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  let [timeoutId, setTimeoutId] = useState([]);

  const handleTooltipOpen = (event, delay=0) => {
    const c =
      <span
        onTouchEnd={(event) => {
          const el = Array.from(myRef.current.getElementsByClassName('selected'));
          if (el && el.length) {
            onClick(
                el[0].dataset.year,
                el[0].dataset.month,
                el[0].dataset.date
              );
          }
        }}
        style={{ display: 'block', lineHeight: '1.3em' }}
        dangerouslySetInnerHTML={{ __html: event.target.dataset.tooltip.replace('\n', `<br/>`) }}>
      </span>;

    if (timeoutId.length) {
      timeoutId.forEach(id => clearTimeout(id));
      timeoutId = [];
    }
    timeoutId.push(setTimeout(() => {
      Array.from(myRef.current.getElementsByClassName('selected')).forEach(e => e.classList.remove('selected'));
      setAnchorEl(event.target);
      setTextContent(c);
    }, delay/2));
    timeoutId.push(setTimeout(() => {
      if (isTouching) {
        event.target.classList.add('selected');
      }
      setIsOpen(true);
    }, delay));
  };

  const handleTooltipClose = (event) => {
    if (timeoutId.length) {
      timeoutId.forEach(id => clearTimeout(id));
      timeoutId = [];
    }
    Array.from(myRef.current.getElementsByClassName('selected')).forEach(e => e.classList.remove('selected'));
    setIsOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip
        title={textContent}
        placement="bottom"
        arrow
        open={isOpen}
        TransitionComponent={Fade}
        PopperProps={{
          popperRef,
          anchorEl: anchorEl,
        }}
      >
        <svg className="calendarGraph" ref={myRef}></svg>
      </Tooltip>
    </ClickAwayListener>
  );
}