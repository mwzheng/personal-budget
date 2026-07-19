"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import Box from "@mui/material/Box";
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
  onDaySelect: (date: string) => void;
}

function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function TransactionCalendar({
  transactions,
  onTransactionSelect,
  onDaySelect,
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
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (formatCalendarDate(calendarApi.getDate()) === calendarAnchorDate) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextCalendarApi = calendarRef.current?.getApi();
      if (!nextCalendarApi) return;

      if (
        formatCalendarDate(nextCalendarApi.getDate()) !== calendarAnchorDate
      ) {
        nextCalendarApi.gotoDate(calendarAnchorDate);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [calendarAnchorDate]);

  const handleEventClick: NonNullable<FullCalendarProps["eventClick"]> = (
    clickInfo,
  ) => {
    const details = clickInfo.event
      .extendedProps as TransactionCalendarEventDetails;
    onTransactionSelect(details.transaction);
  };

  return (
    <Stack spacing={1.5}>
      <Box
        display="flex"
        alignItems="baseline"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        {transactions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No transactions match the current filters.
          </Typography>
        )}
      </Box>
      {invalidDateCount > 0 && (
        <Typography variant="body2" color="warning.main">
          {invalidDateCount} transaction
          {invalidDateCount === 1 ? " has" : "s have"} an invalid date and could
          not be shown on the calendar.
        </Typography>
      )}
      <Box className="transaction-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={calendarAnchorDate}
          headerToolbar={{ left: "title", right: "prev,next today" }}
          height="auto"
          fixedWeekCount={false}
          dayMaxEventRows={5}
          eventDisplay="block"
          eventInteractive
          events={events}
          dateClick={(clickInfo) => onDaySelect(clickInfo.dateStr)}
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            const details = eventInfo.event
              .extendedProps as TransactionCalendarEventDetails;

            return (
              <Box className="transaction-calendar__event-content">
                <Box
                  component="span"
                  className="transaction-calendar__event-meta"
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    alignItems: "flex-start",
                    gap: 0.5,
                  }}
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
            mountInfo.el.setAttribute("aria-label", details.accessibilityLabel);
            mountInfo.el.setAttribute("title", details.accessibilityLabel);
          }}
        />
      </Box>
    </Stack>
  );
}
