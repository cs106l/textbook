import { Box, Divider } from "@mui/material";

export default function FootnoteSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      component="section"
      sx={{
        opacity: 0.8,
        fontSize: ".875rem",
        "& p": {
          fontSize: ".875rem",
        },
        "& h2": {
          display: "none",
        },
        "& a": {
          textDecoration: "none",
        },
      }}
    >
      <Divider />
      {children}
    </Box>
  );
}
