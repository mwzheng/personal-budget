"use client";
import { Alert, Box, Button, Snackbar, Stack } from "@mui/material";
import type {
  UndoNotice,
  TransactionUndoController,
} from "@/lib/reports/transactionUndo";

export function TransactionUndoNotification({
  controller,
  notice,
  announcement,
}: {
  controller: TransactionUndoController;
  notice?: UndoNotice;
  announcement: string;
}) {
  return (
    <>
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: "absolute",
          // Numeric 1 in MUI sx sizing means 100%, not one pixel. Keep this
          // live region accessible without extending the document bounds.
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
        }}
      >
        {announcement}
      </Box>
      <Snackbar
        open={Boolean(notice)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={
            notice?.status === "retry" || notice?.status === "conflict"
              ? "warning"
              : "info"
          }
          onMouseEnter={() => controller.pause("hover", true)}
          onMouseLeave={() => controller.pause("hover", false)}
          onFocus={() => controller.pause("focus", true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              controller.pause("focus", false);
          }}
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: 6,
            alignItems: "center",
            // Keep the icon, message, and action row on the same centerline.
            // Alert's defaults give each region different vertical padding.
            "& .MuiAlert-icon": {
              alignItems: "center",
              padding: 0,
              marginRight: 1.5,
            },
            "& .MuiAlert-message": {
              display: "flex",
              alignItems: "center",
              padding: 0,
            },
            "& .MuiAlert-action": {
              alignItems: "center",
              padding: 0,
              marginLeft: 2,
              marginRight: -1,
            },
          }}
          action={
            <Stack direction="row">
              {notice?.status !== "conflict" && (
                <Button
                  color="inherit"
                  disabled={notice?.status === "restoring"}
                  onClick={() => void controller.restore()}
                >
                  {notice?.status === "restoring"
                    ? "Restoring…"
                    : notice?.status === "retry"
                      ? "Retry"
                      : "Undo"}
                </Button>
              )}
              <Button
                color="inherit"
                disabled={notice?.status === "restoring"}
                onClick={controller.dismiss}
              >
                Dismiss
              </Button>
            </Stack>
          }
        >
          {notice?.message || `“${notice?.transaction.name ?? ""}” deleted`}
        </Alert>
      </Snackbar>
    </>
  );
}
