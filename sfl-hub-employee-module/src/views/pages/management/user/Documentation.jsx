import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import PersonIcon from '@mui/icons-material/Person';





const Documentation = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
 


  const documents = [
    { name: 'EmployeementLetter', date: '08/01/2024', addedBy: 'Lokesh Agarwal' },
    { name: 'Aadhar Card', date: '08/12/2024', addedBy: 'Helly Shah' },
    { name: 'Photo', date: '08/13/2024', addedBy: 'Lokesh Agarwal' },
    { name: '', date: '06/20/2025', addedBy: 'Anshul Agarwal' }
  ];

  

  const totalPages = Math.ceil(documents.length / rowsPerPage);
  const paginatedDocs = documents.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, borderRadius: '8px' }}>
        {/* Header */}
        
        {/* Table */}
        <Table size="small"  sx={{m:2}}>
          <TableHead>
            <TableRow>
              {['Document Name', 'CreatedOn', 'Added By', 'Attachment', 'Actions'].map((head) => (
                <TableCell key={head} sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>

            <TableRow>
              <TableCell>
                <TextField
                 size="small"
                 variant="standard"
                  
                  style={{
                    width: '40%',
                  
                    fontSize: '0.8rem',
                   
                    borderRadius: 4
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                 size="small"
                          variant="standard"
                  style={{
                    width: '40%',
                   
                    fontSize: '0.8rem',
                   
                    borderRadius: 4
                  }}
                  
                />
              </TableCell>
              <TableCell>
                <TextField
                 size="small"
                 variant="standard"
                  style={{
                    width: '40%',
                   
                    fontSize: '0.8rem',
                    
                    borderRadius: 4
                  }}
                />
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
            {paginatedDocs.map((doc, index) => (
              <TableRow
                key={index}
                sx={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' }}
              >
                <TableCell sx={{ fontSize: '0.85rem' }}>{doc.name}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{doc.date}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{doc.addedBy}</TableCell>
                <TableCell>
                  {doc.name ? (
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: '#d2691e',
                        '&:hover': { bgcolor: '#b35000' },
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.5
                      }}
                    >
                      VIEW FILE
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                     
                      sx={{
                        bgcolor: '#d2691e',
                        '&:hover': { bgcolor: '#e64a19' },
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        px: 2.2,
                        py: 0.5
                      }}
                    >
                      UPLOAD
                    </Button>
                  )}
                </TableCell>

                {/* Action Icons */}
                <TableCell sx={{ p: 1, borderBottom: '1px solid #ddd' }}>
                  <Box sx={{ justifyContent: 'center' }}>
                    {doc.name ? (
                      <DeleteIcon
                        sx={{
                          cursor: 'pointer',
                          fontSize: 24,
                          color: '#000'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 32,
                          width: 32,
                          borderRadius: '50%',
                          bgcolor: '#e91e63',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </Box>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Custom Pagination */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            px: 2,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Button
            variant="outlined"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            sx={{
              textTransform: 'none',
              minWidth: 100,
              fontSize: '0.875rem',
              bgcolor: '#f5f5f5',
              borderColor: '#e0e0e0',
              color: '#757575',
              '&:hover': { bgcolor: '#e0e0e0' }
            }}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.875rem' }}>Page</Typography>
            <input
              type="text"
              value={page + 1}
              readOnly
              style={{
                width: '30px',
                border: 'none',
                borderBottom: '1px solid #aaa',
                textAlign: 'center',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'transparent'
              }}
            />
            <Typography sx={{ fontSize: '0.875rem' }}>of {totalPages}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              variant="standard"
              sx={{
                fontSize: '0.875rem',
                minWidth: '80px',
                borderBottom: '1px solid #aaa',
                '&::before': { borderBottom: 'none' },
                '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
              }}
            >
              {[5, 10, 20, 25, 50, 100].map((option) => (
                <MenuItem key={option} value={option}>
                  {option} rows
                </MenuItem>
              ))}
            </Select>

            <Button
              variant="outlined"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
              sx={{
                textTransform: 'none',
                minWidth: 100,
                fontSize: '0.875rem',
                bgcolor: '#f5f5f5',
                borderColor: '#e0e0e0',
                color: '#757575',
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      
    </Box>
  );
};

export default Documentation;
