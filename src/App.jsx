import React from "react";
import "./App.css";
const { useState } = React;

const App = () => {
  const fullTime = 40 * 60;
  const rates = [15, 14, 14, 14, 14, 14, 15];

  const initialArr = Array(7).fill("");
  const [starts, setStarts] = useState([...initialArr]);
  const [ends, setEnds] = useState([...initialArr]);
  const [regHrs, setRegHrs] = useState([...initialArr]);
  const [hrsOT, setHrsOT] = useState([...initialArr]);
  const [totals, setTotals] = useState([...initialArr]);
  const [totalHrs, setTotalHrs] = useState(0);
  const [grossIncome, setGrossIncome] = useState(0);
  const [netIncome, setNetIncome] = useState(0);

  function calculate() {
    let total = 0;
    let totalIncome = 0;
    let lostMins = 0;
    let lastDay = 0;

    for (let day = 0; day < 7; day++) {
      const start = parseTime(starts[day]);
      const end = parseTime(ends[day]);
      if (!isValid(day, start, end)) continue;
      const newShift = end - start;
      const adjustedShift = newShift - 30;
      let shiftIncome = { income: 0, lost: 0 };
      const rate = rates[day];

      if (total >= fullTime) {
        shiftIncome = getShiftIncome(adjustedShift, rate * 1.5);
        hrsOT[day] = formatTimeSpan(newShift);
        regHrs[day] = null;
      } else if (total + adjustedShift >= fullTime) {
        const reg = fullTime - total + 30;
        const overtime = total + adjustedShift - fullTime;
        const regShift = getShiftIncome(reg - 30, rate);
        const OTShift = getShiftIncome(overtime, rate * 1.5);
        shiftIncome = {
          income: regShift.income + OTShift.income,
          lost: regShift.lost + OTShift.lost,
        };
        regHrs[day] = formatTimeSpan(reg);
        hrsOT[day] = formatTimeSpan(overtime);
      } else {
        shiftIncome = getShiftIncome(adjustedShift, rate);
        regHrs[day] = formatTimeSpan(newShift);
        hrsOT[day] = null;
      }
      total += adjustedShift;
      lostMins += shiftIncome.lost;
      totalIncome += shiftIncome.income;
      totals[day] = formatTimeSpan(adjustedShift);
      lastDay = day;
    }
    const roundedLost = roundToQtr(lostMins);
    totalIncome += roundedLost.hourFrac * rates[lastDay];
    const netTotal = calcNetIncome(totalIncome);
    setRegHrs([...regHrs]);
    setHrsOT([...hrsOT]);
    setTotals([...totals]);
    setTotalHrs(total);
    setGrossIncome(totalIncome);
    setNetIncome(netTotal);
  }

  function clearSheet() {
    setStarts([...initialArr]);
    setEnds([...initialArr]);
    setRegHrs([...initialArr]);
    setHrsOT([...initialArr]);
    setTotals([...initialArr]);
    setGrossIncome(0);
    setTotalHrs(0);
  }

  function calcNetIncome(income = 0) {
    if (income <= 0) return 0;
    return 2000 - 0.000128 * Math.pow(income - 3965, 2);
  }

  function getShiftIncome(duration = 0, rate = 0) {
    const rounded = roundToQtr(duration);
    const income = rounded.hourFrac * rate;
    return {
      income,
      lost: rounded.lost,
    };
  }

  function roundToQtr(duration = 0) {
    const hrs = Math.floor(duration / 60);
    const mins = duration % 60;
    const rounded = Math.floor(mins / 15);
    const roundMins = rounded * 15;
    const frac = rounded / 4;
    const lost = mins - roundMins;
    const hourFrac = hrs + frac;
    return { hourFrac, lost };
  }

  function parseTime(time = 0) {
    const timeStr = `${time}`;
    let hrs = 0;
    let mins = 0;
    if (timeStr.includes(":")) {
      const pcs = timeStr.split(":");
      hrs = parseInt(pcs[0]);
      mins = parseInt(pcs[1]);
    } else {
      hrs = timeStr.slice(0, timeStr.length - 2);
      mins = timeStr.slice(-2);
    }
    hrs = parseInt(hrs);
    mins = parseInt(mins);
    return hrs * 60 + mins;
  }

  function formatTimeSpan(duration = 0) {
    const parsed = parseInt(duration) || 0;
    const hrs = `${Math.floor(parsed / 60)}`;
    const mins = `${parsed % 60}`.padStart(2, "0");
    return `${hrs}h ${mins}min`;
  }

  function formatClockTime(time = "") {
    const timeStr = `${time}`.replace(/:/, "");
    const hrs = timeStr.slice(0, timeStr.length - 2) || "0";
    const mins = timeStr.slice(-2);
    return `${parseInt(hrs)}:${mins.padStart(2, "0")}`;
  }

  function isValid(idx, start, end) {
    if (!starts[idx] || !ends[idx] || end < start + 30) {
      regHrs[idx] = null;
      hrsOT[idx] = null;
      totals[idx] = null;
      return false;
    }
    return true;
  }

  function getInputCol(element) {
    const eltClass = element.className;
    if (eltClass.includes("start")) {
      return [starts, setStarts];
    } else if (eltClass.includes("end")) {
      return [ends, setEnds];
    }
    return [];
  }

  function updateInput(event) {
    const [arr, setArr] = getInputCol(event.target);
    if (!setArr) return;

    const day = event.target.getAttribute("data-idx");
    arr[day] = formatClockTime(event.target.value);
    setArr([...arr]);
  }

  function updateOnBlur(event) {
    const [arr, setArr] = getInputCol(event.target);
    if (!setArr) return;

    const val = event.target.value;
    if (val === "0:00") {
      const day = event.target.getAttribute("data-idx");
      arr[day] = "";
      setArr([...arr]);
    }
  }

  function navGridInputs(event) {
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }
    const cell = event.target;
    const row = cell.parentNode;
    const colIdx = cell.getAttribute("col-idx");
    const rowIdx = row.getAttribute("row-idx");
    if (event.key === "ArrowUp" && parseInt(rowIdx) > 0) {
      row.previousSibling.childNodes[parseInt(colIdx)].focus();
    } else if (event.key === "ArrowDown" && parseInt(rowIdx) < 6) {
      row.nextSibling.childNodes[parseInt(colIdx)].focus();
    }
  }

  function populateRows() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const tableRows = [];

    tableRows.push(
      <div key={0} className="row-header">
        <div className="cell-day" tabIndex={-1}>
          Day
        </div>
        <div className="cell-start" tabIndex={-1}>
          Start Time
        </div>
        <div className="cell-end" tabIndex={-1}>
          End Time
        </div>
        <div className="cell-reg-hrs" tabIndex={-1}>
          Regular Hours
        </div>
        <div className="cell-OT-hrs" tabIndex={-1}>
          OT Hours
        </div>
        <div className="cell-total-hrs" tabIndex={-1}>
          Total Hrs
        </div>
      </div>,
    );

    for (let idx in days) {
      const day = days[idx];

      tableRows.push(
        <div row-idx={idx} key={idx + 1} className={`row-${day}`}>
          <div col-idx={0} className="cell-day">
            {day}
          </div>
          <input
            col-idx={1}
            id={`start-${day}`}
            data-idx={idx}
            className="cell-start"
            onChange={updateInput}
            onKeyDown={navGridInputs}
            onBlur={updateOnBlur}
            value={starts[idx]}
          />
          <input
            col-idx={2}
            id={`end-${day}`}
            data-idx={idx}
            className="cell-end"
            onChange={updateInput}
            onKeyDown={navGridInputs}
            onBlur={updateOnBlur}
            value={ends[idx]}
          />
          <div col-idx={3} className="cell-reg-hrs">
            {regHrs[idx] || "—"}
          </div>
          <div col-idx={4} className="cell-OT-hrs">
            {hrsOT[idx] || "—"}
          </div>
          <div col-idx={5} className="cell-total-hrs">
            {totals[idx] || "—"}
          </div>
        </div>,
      );
    }

    tableRows.push(
      <div key={7} className="row-footer">
        <div className="cell-income-gross" tabIndex={-1}>
          Gross Income:
          <div className="separator" />
          {grossIncome ? <b>${grossIncome.toFixed(2)}</b> : "—"}
        </div>
        <div className="cell-income-net" tabIndex={-1}>
          Net Income:
          <div className="separator" />
          {netIncome ? <b>${netIncome.toFixed(2)}</b> : "—"}
        </div>
        <div className="cell-total-hrs" tabIndex={-1}>
          Total:
          <div className="separator" />
          {totalHrs ? <b>{formatTimeSpan(totalHrs)}</b> : "—"}
        </div>
      </div>,
    );

    return tableRows;
  }

  return (
    <>
      <header>Timesheet Calculator</header>
      <div
        className="container"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            calculate();
          }
        }}
      >
        {populateRows()}
        <div className="button-row">
          <button className="clear-sheet" onClick={clearSheet}>
            Clear Sheet
          </button>
          <button className="calc-enter" onClick={calculate}>
            Calculate
          </button>
        </div>
      </div>
    </>
  );
};

export default App;
