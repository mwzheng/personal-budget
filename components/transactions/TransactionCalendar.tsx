"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, type ComponentProps } from "react";

import type { Transaction } from "@/lib/types/types";
import {
  mapTransactionsToCalendarEvents,
  TransactionCalendarEventDetails,
} from "@/lib/utils/transaction-calendar";

type FullCalendarProps = ComponentProps<typeof FullCalendar>;

interface Props {
  transactions: Transaction[];
  onTransactionSelect: (transaction: Transaction) => void;
}

/**
 * Note 1: This component stays presentational: it renders the filtered
 * transactions as calendar events and reports clicks upward so ReportsPage keeps
 * ownership of dialog state and the existing edit/delete mutation handlers.
 */
export function TransactionCalendar({
  transactions,
  onTransactionSelect,
}: Props) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const events = useMemo(
    () => mapTransactionsToCalendarEvents(transactions),
    [transactions],
  );
  const invalidDateCount = transactions.length - events.length;
  const calendarAnchorDate = useMemo(() => {
    if (events.length === 0) {
      return new Date().toISOString().slice(0, 10);
    }

    return events.reduce((latestDate, event) => {
      return event.start > latestDate ? event.start : latestDate;
    }, events[0].start);
  }, [events]);

  useEffect(() => {
    if (!calendarRef.current) return;

    // Note 3: Reports often filter into historical months, so keeping the
    // visible month anchored to the newest filtered event prevents the calendar
    // from opening on an empty current-month grid that looks broken.
    calendarRef.current.getApi().gotoDate(calendarAnchorDate);
  }, [calendarAnchorDate]);

  const handleEventClick: NonNullable<FullCalendarProps["eventClick"]> = (
    clickInfo,
  ) => {
    const details = clickInfo.event
      .extendedProps as TransactionCalendarEventDetails;
    onTransactionSelect(details.transaction);
  };

  return (
    <Paper sx={{ p: { xs: 1, sm: 2 } }}>
      <Stack spacing={1.5}>
        <Box
          display="flex"
          alignItems="baseline"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="body2" color="text.secondary">
            Select a calendar entry to review the transaction details, then edit
            or delete it from the popup.
          </Typography>
          {transactions.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No transactions match the current filters.
            </Typography>
          )}
        </Box>
        {invalidDateCount > 0 && (
          <Typography variant="body2" color="warning.main">
            {invalidDateCount} transaction
            {invalidDateCount === 1 ? " has" : "s have"} an invalid date and
            could not be shown on the calendar.
          </Typography>
        )}

        <Box className="transaction-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={calendarAnchorDate}
            headerToolbar={{ left: "prev,next today", center: "title" }}
            height="auto"
            fixedWeekCount={false}
            dayMaxEventRows={5}
            eventDisplay="block"
            eventInteractive
            events={events}
            eventClick={handleEventClick}
            // Note 2: Rendering the event body ourselves lets each tile show the
            // amount and category at a glance instead of relying on a generic title
            // string that would truncate the context users care about most.
            eventContent={(eventInfo) => {
              const details = eventInfo.event
                .extendedProps as TransactionCalendarEventDetails;

              return (
                <Box className="transaction-calendar__event-content">
                  <Box
                    component="span"
                    className="transaction-calendar__event-meta"
                  >
                    <Box
                      component="span"
                      className="transaction-calendar__event-amount"
                    >
                      {details.amountLabel}
                    </Box>
                    <Box
                      component="span"
                      className="transaction-calendar__event-category"
                    >
                      {details.categoryLabel}
                    </Box>
                  </Box>
                  <Box
                    component="span"
                    className="transaction-calendar__event-name"
                  >
                    {details.transactionName}
                  </Box>
                </Box>
              );
            }}
            eventDidMount={(mountInfo) => {
              const details = mountInfo.event
                .extendedProps as TransactionCalendarEventDetails;
              mountInfo.el.setAttribute(
                "aria-label",
                details.accessibilityLabel,
              );
              mountInfo.el.setAttribute("title", details.accessibilityLabel);
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
