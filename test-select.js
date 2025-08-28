// Test simple para verificar el funcionamiento básico
const testSelect = () => {
  console.log('Test de selector simple');
  
  const departamentos = [
    { id: 1, nombre_departamento: "Francisco Morazán" },
    { id: 2, nombre_departamento: "Cortés" },
    { id: 3, nombre_departamento: "Atlántida" }
  ];
  
  const [selectedId, setSelectedId] = useState('');
  
  const handleChange = (e) => {
    console.log('Cambio:', e.target.value);
    setSelectedId(e.target.value);
  };
  
  return (
    <select value={selectedId} onChange={handleChange}>
      <option value="">Seleccione...</option>
      {departamentos.map(dept => (
        <option key={dept.id} value={dept.id}>
          {dept.nombre_departamento}
        </option>
      ))}
    </select>
  );
};
