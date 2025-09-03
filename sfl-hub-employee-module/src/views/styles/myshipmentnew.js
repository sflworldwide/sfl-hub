import { styled } from '@mui/material/styles';
import { Box, Paper, Table, Typography, Button } from '@mui/material';

{/*export const IconBox = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 55,
    height: 55,
    //borderRadius: 7,
    backgroundColor: '#c30ac9',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
    marginRight: theme.spacing(3),
    marginLeft: theme.spacing(1),
  })); */}

  export const IconBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 55,
    height: 55,
    borderRadius: 3,
    backgroundColor: '#c30ac9',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
    position: 'absolute', // Use absolute positioning
    left: '-8px', // Adjust this value to control overlap (increased for visibility)
    top: '-28%', // Center vertically
    transform: 'translateY(-50%)', // Fine-tune vertical alignment
    zIndex: 1,
    marginRight:theme.spacing(1) // Ensure it stays above SectionPaper
  }));


export const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginTop: theme.spacing(2.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
}));

export const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: theme.spacing(2.5),
  marginTop: theme.spacing(2.5),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(1.5),
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
  },
}));

export const TableStyled = styled(Table)(({ theme }) => ({
  width: '100%',
  borderCollapse: 'collapse',
  '& th': {
    backgroundColor: theme.palette.grey[800],
    color: theme.palette.common.white,
    padding: theme.spacing(1.25),
    border: `1px solid ${theme.palette.grey[700]}`,
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.75),
      fontSize: '0.75rem',
    },
  },
  '& td': {
    padding: theme.spacing(1.25),
    border: `1px solid ${theme.palette.divider}`,
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.75),
      fontSize: '0.75rem',
    },
  },
  '& tr:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2.5),
  marginTop: theme.spacing(2.5),
  justifyContent: 'flex-end',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    alignItems: 'stretch',
  },
}));

export const ResponsiveTypography = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

export const ResponsiveButton = styled(Button)(({ theme }) => ({
  fontSize: '0.875rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
    width: '100%',
  },
}));