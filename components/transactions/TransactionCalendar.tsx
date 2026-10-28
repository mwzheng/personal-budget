"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import Box from "@mui/material/Box";
import Popper from "@mui/material/Popper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";

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
  const focusListeners = useRef(
    new WeakMap<HTMLElement, { focus: () => void; blur: () => void }>(),
  );
  const [tooltip, setTooltip] = useState<{
    anchor: HTMLElement;
    details: TransactionCalendarEventDetails;
    color: string;
  } | null>(null);
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
    setTooltip(null);
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
      <Box
        className="transaction-calendar"
        sx={{ minWidth: 0, maxWidth: "100%" }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={calendarAnchorDate}
          headerToolbar={{ left: "title", right: "prev,next today" }}
          height="auto"
          stickyHeaderDates={false}
          stickyFooterScrollbar={false}
          buttonIcons={false}
          buttonText={{ prev: "Previous", next: "Next", today: "Today" }}
          fixedWeekCount={false}
          dayMaxEventRows={5}
          eventDisplay="block"
          eventInteractive
          events={events}
          dateClick={(clickInfo) => onDaySelect(clickInfo.dateStr)}
          eventClick={handleEventClick}
          eventMouseEnter={({ el, event }) =>
            setTooltip({
              anchor: el,
              details: event.extendedProps as TransactionCalendarEventDetails,
              color: getComputedStyle(el).borderLeftColor,
            })
          }
          eventMouseLeave={({ el }) =>
            setTooltip((current) =>
              current?.anchor === el && document.activeElement !== el
                ? null
                : current,
            )
          }
          eventContent={(eventInfo) => {
            const details = eventInfo.event
              .extendedProps as TransactionCalendarEventDetails;

            return (
              <Box className="transaction-calendar__event-content">
                <Box
                  component="span"
                  className="transaction-calendar__event-amount"
                >
                  {details.amountLabel}
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
            const { transaction } = details;
            mountInfo.el.setAttribute(
              "aria-label",
              [
                details.accessibilityLabel,
                transaction.tags.length
                  ? `Tags: ${transaction.tags.join(", ")}.`
                  : "",
                transaction.notes ? `Note: ${transaction.notes}` : "",
              ]
                .filter(Boolean)
                .join(" "),
            );
            const focus = () =>
              setTooltip({
                anchor: mountInfo.el,
                details,
                color: getComputedStyle(mountInfo.el).borderLeftColor,
              });
            const blur = () =>
              setTooltip((current) =>
                current?.anchor === mountInfo.el ? null : current,
              );
            focusListeners.current.set(mountInfo.el, { focus, blur });
            mountInfo.el.addEventListener("focus", focus);
            mountInfo.el.addEventListener("blur", blur);
          }}
          eventWillUnmount={({ el }) => {
            const listeners = focusListeners.current.get(el);
            if (listeners) {
              el.removeEventListener("focus", listeners.focus);
              el.removeEventListener("blur", listeners.blur);
              focusListeners.current.delete(el);
            }
            setTooltip((current) => (current?.anchor === el ? null : current));
          }}
        />
        <Popper
          open={Boolean(tooltip)}
          anchorEl={tooltip?.anchor}
          placement="top-start"
          modifiers={[{ name: "offset", options: { offset: [0, 7] } }]}
          sx={{ zIndex: 1500, pointerEvents: "none" }}
        >
          {tooltip && (
            <Box
              aria-hidden="true"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                width: "max-content",
                maxWidth: "min(250px, 70vw)",
                p: "8px 10px",
                border: "1px solid",
                borderColor: "divider",
                borderLeft: `3px solid ${tooltip.color}`,
                borderRadius: "4px",
                bgcolor: "background.paper",
                boxShadow: "0 5px 18px rgba(15,25,18,.2)",
                color: "text.primary",
                fontSize: "11px",
                lineHeight: 1.55,
                overflowWrap: "anywhere",
              }}
            >
              <Box component="strong" sx={{ fontSize: "12px" }}>
                {tooltip.details.transactionName}
              </Box>
              <span>
                <b>Amount:</b> {tooltip.details.amountLabel}
              </span>
              <span>
                <b>Category:</b> {tooltip.details.categoryLabel}
              </span>
              {tooltip.details.transaction.tags.length > 0 && (
                <span>
                  <b>Tags:</b> {tooltip.details.transaction.tags.join(", ")}
                </span>
              )}
              {tooltip.details.transaction.notes && (
                <span>
                  <b>Note:</b> {tooltip.details.transaction.notes}
                </span>
              )}
            </Box>
          )}
        </Popper>
      </Box>
    </Stack>
  );
}
