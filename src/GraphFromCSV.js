// App.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ResponsiveContainer
} from 'recharts';

const App = () => {
  const [csvData, setCsvData] = useState([]);

  useEffect(() => {
    fetch('/Dataset.csv') // Adjust the path according to where your CSV file is located
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            const processedData = result.data.map(row => ({
              procedure: row.procedure,
              age: parseFloat(row.age),
              gender: row.gender === 'm' ? 'Male' : 'Female',
              // hypertension: row.hypertension === 'y' ? 1 : 0,
              // renal_failure: row.renal_failure === 'y' ? 1 : 0,
              // CAD: row.CAD === 'y' ? 1 : 0,
              // DM: row.DM === 'y' ? 1 : 0,
              // stroke: row.stroke === 'y' ? 1 : 0,
              no_readmissions: parseInt(row.no_readmissions, 10),
              death: row.death === 'y' ? 1 : 0,
            }));
            setCsvData(processedData);
          }
        });
      })
      .catch(error => console.error('Error fetching the CSV file:', error));
  }, []);

  // Prepare data for gender distribution pie chart
  const genderData = [
    { name: 'Male', value: csvData.filter(d => d.gender === 'Male').length },
    { name: 'Female', value: csvData.filter(d => d.gender === 'Female').length },
  ];

  // Prepare data for readmissions bar chart
  const readmissionData = [
    { name: 'No Readmissions', value: csvData.filter(d => d.no_readmissions === 0).length },
    { name: 'With Readmissions', value: csvData.filter(d => d.no_readmissions > 0).length },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Medical Procedure Data Visualization</h2>

      {csvData.length > 0 ? (
        <>
          {/* Line Chart for Age Distribution by Procedure */}
          <h3>Age Distribution by Procedure</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={csvData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="procedure" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="age" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>

          {/* Bar Chart for Readmissions */}
          <h3>Readmissions Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={readmissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>

          {/* Pie Chart for Gender Distribution */}
          <h3>Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0088FE' : '#FF8042'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          {/* Scatter Plot for Age vs Death */}
          <h3>Age vs Death</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="age" name="Age" unit="years" />
              <YAxis type="number" dataKey="death" name="Death" unit="Status" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Patients" data={csvData.map(d => ({ age: d.age, death: d.death }))} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default App;
