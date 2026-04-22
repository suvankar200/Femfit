import React, { useState, useMemo } from 'react';
import {
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  getDay,
  format,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CycleCalendar = ({ cycleData, predictions }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { t } = useLanguage();

  const DAY_NAMES = [
    t('cal.mon'), t('cal.tue'), t('cal.wed'), t('cal.thu'),
    t('cal.fri'), t('cal.sat'), t('cal.sun')
  ];

  if (!cycleData || !predictions) return null;

  const allCycles = useMemo(() => {
    if (!predictions.cycles) return [];
    return predictions.cycles.map((c) => ({
      periodStart: startOfDay(new Date(c.periodStart)),
      periodEnd: startOfDay(new Date(c.periodEnd)),
      ovulation: startOfDay(new Date(c.ovulation)),
      fertileStart: startOfDay(new Date(c.fertileStart)),
      fertileEnd: startOfDay(new Date(c.fertileEnd)),
    }));
  }, [predictions.cycles]);

  const currentCycleStart = startOfDay(new Date(predictions.currentCycleStart));

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    let startDay = getDay(monthStart);
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];

    const prevMonthEnd = endOfMonth(subMonths(monthStart, 1));
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(prevMonthEnd);
      d.setDate(d.getDate() - i);
      days.push({ date: startOfDay(d), isCurrentMonth: false });
    }

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      days.push({ date: startOfDay(new Date(d)), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    const nextMonthStart = addMonths(monthStart, 1);
    for (let i = 0; i < remaining; i++) {
      const d = new Date(nextMonthStart);
      d.setDate(d.getDate() + i);
      days.push({ date: startOfDay(d), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Get phase for a date - simplified to only key events
  const getPhaseInfo = (date) => {
    const d = startOfDay(date);
    const todayDate = startOfDay(new Date());

    for (const cycle of allCycles) {
      try {
        if (isWithinInterval(d, { start: cycle.periodStart, end: cycle.periodEnd })) {
          const dayNum = Math.floor((d - cycle.periodStart) / (1000 * 60 * 60 * 24)) + 1;
          const isPredicted = d > todayDate;
          return { type: 'period', dayNum, isPredicted };
        }
        if (isSameDay(d, cycle.ovulation)) {
          return { type: 'ovulation' };
        }
        if (isWithinInterval(d, { start: cycle.fertileStart, end: cycle.fertileEnd })) {
          return { type: 'fertile' };
        }
      } catch {
        // skip invalid intervals
      }
    }
    return null;
  };

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="cyc-cal">
      {/* Navigation */}
      <div className="cyc-nav">
        <button className="cyc-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <button className="cyc-nav-title" onClick={goToToday} title="Go to today">
          {format(currentMonth, 'MMMM yyyy')}
        </button>
        <button className="cyc-nav-btn" onClick={goToNextMonth} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day name headers */}
      <div className="cyc-grid cyc-days-header">
        {DAY_NAMES.map((day) => (
          <div key={day} className="cyc-day-label">{day}</div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="cyc-grid cyc-body">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const today = isToday(date);
          const phase = getPhaseInfo(date);
          const dayOfWeek = getDay(date);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          let cellClass = 'cyc-cell';
          if (!isCurrentMonth) cellClass += ' cyc-dim';
          if (today) cellClass += ' cyc-today';
          if (phase?.type === 'fertile') cellClass += ' cyc-fertile-bg';

          return (
            <div key={idx} className={cellClass}>
              {/* Period marker */}
              {phase?.type === 'period' && !phase.isPredicted && (
                <div className="cyc-marker cyc-period-marker" />
              )}
              {phase?.type === 'period' && phase.isPredicted && (
                <div className="cyc-marker cyc-predicted-marker" />
              )}
              {/* Ovulation marker */}
              {phase?.type === 'ovulation' && (
                <div className="cyc-marker cyc-ov-marker" />
              )}

              <span className={`cyc-num ${
                (phase?.type === 'period' && !phase.isPredicted) || phase?.type === 'ovulation' ? 'cyc-white' : ''
              } ${isWeekend && !phase ? 'cyc-weekend' : ''}`}>
                {format(date, 'd')}
              </span>

              {phase?.type === 'period' && (
                <span className={`cyc-day-tag ${phase.isPredicted ? 'cyc-tag-muted' : ''}`}>
                  {t('cal.day')} {phase.dayNum}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Clean legend */}
      <div className="cyc-legend">
        <div className="cyc-legend-item">
          <span className="cyc-legend-dot" style={{ background: '#e74c6f' }}></span>
          {t('cal.period')}
        </div>
        <div className="cyc-legend-item">
          <span className="cyc-legend-ring"></span>
          {t('cal.predicted')}
        </div>
        <div className="cyc-legend-item">
          <span className="cyc-legend-dot" style={{ background: '#5b8def' }}></span>
          {t('cal.ovulation')}
        </div>
        <div className="cyc-legend-item">
          <span className="cyc-legend-dot" style={{ background: '#a8e6cf' }}></span>
          {t('cal.fertileWindow')}
        </div>
      </div>
    </div>
  );
};

export default CycleCalendar;
