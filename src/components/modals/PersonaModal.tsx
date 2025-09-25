'use client';'use client';



import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';

import Swal from 'sweetalert2';import Swal from 'sweetalert2';

import { XMarkIcon } from '@heroicons/react/24/outline';import { XMarkIcon } from '@heroicons/react/24/outline';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

interface PersonaModalProps {    const { name, value } = e.target;

  isOpen: boolean;    

  onClose: () => void;    console.log('🔄 SIMPLE CHANGE:', { name, value });

  onSuccess: (data: any) => void;    

  persona?: any;    setFormData(prev => {

}      const newData = { ...prev, [name]: value };

      console.log('📋 NEW FORM DATA:', newData);

interface FormData {      return newData;

  numero_identidad: string;    });

  nombres: string;  };ersonaModalProps {

  apellidos: string;  isOpen: boolean;

  fecha_nacimiento: string;  onClose: () => void;

  genero: string;  onSuccess: (data: any) => void;

  estado_civil: string;  persona?: any;

  telefono: string;}

  email: string;

  direccion: string;interface FormData {

  departamento_id: string | null;  numero_identidad: string;

  municipio_id: string | null;  nombres: string;

  sector_id: string | null;  apellidos: string;

}  fecha_nacimiento: string;

  genero: string;

const initialFormData: FormData = {  estado_civil: string;

  numero_identidad: '',  telefono: string;

  nombres: '',  email: string;

  apellidos: '',  direccion: string;

  fecha_nacimiento: '',  departamento_id: string | null;

  genero: '',  municipio_id: string | null;

  estado_civil: '',  sector_id: string | null;

  telefono: '',}

  email: '',

  direccion: '',const initialFormData: FormData = {

  departamento_id: null,  numero_identidad: '',

  municipio_id: null,  nombres: '',

  sector_id: null,  apellidos: '',

};  fecha_nacimiento: '',

  genero: '',

export default function PersonaModal({ isOpen, onClose, onSuccess, persona }: PersonaModalProps) {  estado_civil: '',

  const [currentStep, setCurrentStep] = useState(1);  telefono: '',

  const [formData, setFormData] = useState<FormData>(initialFormData);  email: '',

  const [loading, setLoading] = useState(false);  direccion: '',

  const [departamentos, setDepartamentos] = useState<any[]>([]);  departamento_id: null,

  const [municipios, setMunicipios] = useState<any[]>([]);  municipio_id: null,

  const [sectores, setSectores] = useState<any[]>([]);  sector_id: null,

};

  const steps = [

    { id: 1, title: 'Información Personal' },export default function PersonaModal({ isOpen, onClose, onSuccess, persona }: PersonaModalProps) {

    { id: 2, title: 'Ubicación' },  const [currentStep, setCurrentStep] = useState(1);

    { id: 3, title: 'Contacto' },    const [formData, setFormData] = useState<FormData>({

    { id: 4, title: 'Sacramentos' },    numero_identidad: '',

  ];    nombres: '',

    apellidos: '',

  useEffect(() => {    fecha_nacimiento: '',

    if (isOpen) {    genero: '',

      if (persona) {    estado_civil: '',

        setFormData(persona);    telefono: '',

      } else {    email: '',

        setFormData(initialFormData);    direccion: '',

        setCurrentStep(1);    departamento_id: null,

      }    municipio_id: null,

      // Cargar departamentos    sector_id: null,

      cargarDepartamentos();  });

    }  const [loading, setLoading] = useState(false);

  }, [persona, isOpen]);  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);

  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  const cargarDepartamentos = async () => {  const [departamentos, setDepartamentos] = useState<any[]>([]);

    try {  const [municipios, setMunicipios] = useState<any[]>([]);

      const response = await fetch('/api/ubicacion/departamentos');  const [sectores, setSectores] = useState<any[]>([]);

      if (response.ok) {

        const data = await response.json();  const steps = [

        setDepartamentos(data);    { id: 1, title: 'Información Personal' },

      }    { id: 2, title: 'Ubicación' },

    } catch (error) {    { id: 3, title: 'Contacto' },

      console.error('Error al cargar departamentos:', error);    { id: 4, title: 'Sacramentos' },

    }  ];

  };

  // Debug: Log cuando cambia formData

  const cargarMunicipios = async (departamentoId: string) => {  useEffect(() => {

    try {    console.log('FormData updated:', formData);

      const response = await fetch(`/api/ubicacion/municipios?departamento=${departamentoId}`);  }, [formData]);

      if (response.ok) {

        const data = await response.json();  useEffect(() => {

        setMunicipios(data);    if (isOpen) {

      }      if (persona) {

    } catch (error) {        setFormData(persona);

      console.error('Error al cargar municipios:', error);      } else {

    }        // Reset completo del formulario para nueva persona

  };        setFormData(initialFormData);

        setCurrentStep(1);

  const cargarSectores = async () => {      }

    try {    }

      const response = await fetch('/api/sectores');  }, [persona, isOpen]);

      if (response.ok) {

        const data = await response.json();  useEffect(() => {

        setSectores(data);    if (isOpen) {

      }      console.log('🚀 Modal abierto, cargando departamentos...');

    } catch (error) {      setLoadingDepartamentos(true);

      console.error('Error al cargar sectores:', error);      fetch('/api/ubicacion/departamentos')

    }        .then(res => {

  };          console.log('🌍 Respuesta departamentos:', res.status, res.ok);

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

  useEffect(() => {          return res.json();

    if (isOpen) {        })

      cargarSectores();        .then(data => {

    }          console.log('✅ Departamentos cargados:', data.length, 'items');

  }, [isOpen]);          if (data.length > 0) {

            console.log('🔍 Primer departamento:', data[0]);

  useEffect(() => {            console.log('🔍 Keys del primer departamento:', Object.keys(data[0]));

    if (formData.departamento_id) {          }

      cargarMunicipios(formData.departamento_id);          setDepartamentos(data);

    } else {        })

      setMunicipios([]);        .catch(error => {

      setFormData(prev => ({ ...prev, municipio_id: null }));          console.error('❌ Error cargando departamentos:', error);

    }        })

  }, [formData.departamento_id]);        .finally(() => {

          setLoadingDepartamentos(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {        });

    const { name, value } = e.target;    }

      }, [isOpen]);

    setFormData(prev => {

      const newData = { ...prev, [name]: value };  useEffect(() => {

      return newData;    if (formData.departamento_id) {

    });      console.log('🏘️ Cargando municipios para departamento:', formData.departamento_id);

  };      // El departamento_id ya es el codigo_departamento

      fetch(`/api/ubicacion/municipios?departamento=${formData.departamento_id}`)

  const validateStep = (step: number): boolean => {        .then(res => {

    switch (step) {          console.log('📡 Respuesta municipios:', res.status);

      case 1:          return res.json();

        return !!(formData.numero_identidad && formData.nombres && formData.apellidos &&         })

                 formData.fecha_nacimiento && formData.genero);        .then(data => {

      case 2:          console.log('🏘️ Municipios cargados:', data);

        return !!(formData.departamento_id && formData.municipio_id);          setMunicipios(data);

      case 3:        })

        return !!formData.telefono;        .catch(error => {

      default:          console.error('❌ Error cargando municipios:', error);

        return false;        });

    }    } else {

  };      console.log('🏘️ Limpiando municipios - no hay departamento seleccionado');

      setMunicipios([]);

  const nextStep = () => {      setFormData(prev => ({ ...prev, municipio_id: null }));

    if (currentStep < 4 && validateStep(currentStep)) {    }

      setCurrentStep(prev => prev + 1);  }, [formData.departamento_id]);

    }

  };  useEffect(() => {

    // Cargar sectores parroquiales siempre (independiente de ubicación)

  const prevStep = () => {    console.log('🏛️ Cargando todos los sectores parroquiales');

    if (currentStep > 1) {    fetch(`/api/sectores`)

      setCurrentStep(prev => prev - 1);      .then(res => {

    }        console.log('📡 Respuesta sectores - Status:', res.status);

  };        console.log('📡 Respuesta sectores - OK:', res.ok);

        if (!res.ok) {

  const handleSubmit = async () => {          throw new Error(`HTTP error! status: ${res.status}`);

    if (!validateStep(3)) return;        }

            return res.json();

    setLoading(true);      })

    try {      .then(data => {

      const response = await fetch('/api/personas', {        console.log('🏛️ Sectores cargados - Total:', data.length);

        method: 'POST',        console.log('🏛️ Sectores cargados - Data:', data);

        headers: {        setSectores(data);

          'Content-Type': 'application/json',      })

        },      .catch(error => {

        body: JSON.stringify(formData),        console.error('❌ Error cargando sectores:', error);

      });      });

  }, []); // Sin dependencias - se carga una sola vez al abrir el modal

      if (response.ok) {

        const result = await response.json();  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

            const { name, value } = e.target;

        await Swal.fire({    

          icon: 'success',    console.log('� SIMPLE CHANGE:', { name, value });

          title: '¡Éxito!',    

          text: 'La persona se ha registrado correctamente.',    // Para probar, mantener todo como string primero

          showConfirmButton: true,    setFormData(prev => {

          confirmButtonText: 'OK',      const newData = { ...prev, [name]: value };

          confirmButtonColor: '#22c55e'      console.log('� NEW FORM DATA:', newData);

        });      return newData;

    });

        onSuccess(result);  };

        onClose();

      } else {  const validateStep = (step: number): boolean => {

        const errorData = await response.json();    switch (step) {

        const errorMessage = errorData.error || 'Error desconocido al registrar la persona';      case 1:

                return !!(formData.numero_identidad && formData.nombres && formData.apellidos && 

        await Swal.fire({                 formData.fecha_nacimiento && formData.genero);

          icon: 'error',      case 2:

          title: 'Error al Registrar',        return !!(formData.departamento_id && formData.municipio_id);

          text: errorMessage,      case 3:

          showConfirmButton: true,        return !!formData.telefono;

          confirmButtonText: 'Entendido',      default:

          confirmButtonColor: '#ef4444'        return false;

        });    }

      }  };

      

    } catch (error) {  const nextStep = () => {

      console.error('Error en la petición:', error);    if (currentStep < 3 && validateStep(currentStep)) {

            setCurrentStep(prev => prev + 1);

      await Swal.fire({    }

        icon: 'error',  };

        title: 'Error al Registrar',

        text: 'Error de conexión. Intente nuevamente.',  const prevStep = () => {

        showConfirmButton: true,    if (currentStep > 1) {

        confirmButtonText: 'Entendido',      setCurrentStep(prev => prev - 1);

        confirmButtonColor: '#ef4444'    }

      });  };

      

    } finally {  const handleSubmit = async () => {

      setLoading(false);    if (!validateStep(3)) return;

    }    

  };    setLoading(true);

    try {

  if (!isOpen) return null;      console.log('🚀 Enviando datos:', formData);

      

  const renderStep = () => {      const response = await fetch('/api/personas', {

    switch (currentStep) {        method: 'POST',

      case 1:        headers: {

        return (          'Content-Type': 'application/json',

          <div className="space-y-6">        },

            <div className="text-center mb-6">        body: JSON.stringify(formData),

              <h3 className="text-xl font-semibold">Información Personal</h3>      });

              <p className="text-sm text-base-content/60 mt-2">Complete los datos básicos de la persona</p>

            </div>      console.log('📡 Respuesta recibida - Status:', response.status);

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">      console.log('📡 Respuesta recibida - OK:', response.ok);

              <div className="form-control">

                <label className="label" htmlFor="numero_identidad">      if (response.ok) {

                  <span className="label-text font-medium">Número de Identidad *</span>        const result = await response.json();

                </label>        

                <input        await Swal.fire({

                  id="numero_identidad"          icon: 'success',

                  type="text"          title: '¡Éxito!',

                  name="numero_identidad"          text: 'La persona se ha registrado correctamente.',

                  placeholder="0801-1990-12345"          showConfirmButton: true,

                  className="input input-bordered w-full"          confirmButtonText: 'OK',

                  value={formData.numero_identidad}          confirmButtonColor: '#10b981'

                  onChange={handleInputChange}        });

                  maxLength={15}        

                />        onSuccess(result);

                <div className="label">        onClose();

                  <span className="label-text-alt text-xs">Formato: 0000-0000-00000</span>      } else {

                </div>        // Obtener el detalle del error del servidor

              </div>        const errorData = await response.text();

        console.error('❌ Error del servidor - Status:', response.status);

              <div className="form-control">        console.error('❌ Error del servidor - Data:', errorData);

                <label className="label" htmlFor="genero">        

                  <span className="label-text font-medium">Género *</span>        let errorMessage = 'Error al guardar la persona';

                </label>        try {

                <select          const parsedError = JSON.parse(errorData);

                  id="genero"          errorMessage = parsedError.details || parsedError.error || errorMessage;

                  name="genero"        } catch {

                  className="select select-bordered w-full"          errorMessage = errorData || errorMessage;

                  value={formData.genero}        }

                  onChange={handleInputChange}        

                >        throw new Error(`${errorMessage} (Status: ${response.status})`);

                  <option value="" disabled>Seleccione...</option>      }

                  <option value="Masculino">Masculino</option>    } catch (error) {

                  <option value="Femenino">Femenino</option>      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al registrar la persona';

                </select>      

              </div>      await Swal.fire({

        icon: 'error',

              <div className="form-control">        title: 'Error al Registrar',

                <label className="label" htmlFor="nombres">        text: errorMessage,

                  <span className="label-text font-medium">Nombres *</span>        showConfirmButton: true,

                </label>        confirmButtonText: 'Entendido',

                <input        confirmButtonColor: '#ef4444'

                  id="nombres"      });

                  type="text"      

                  name="nombres"    } finally {

                  placeholder="Juan Carlos"      setLoading(false);

                  className="input input-bordered w-full"    }

                  value={formData.nombres}  };

                  onChange={handleInputChange}

                />  if (!isOpen) return null;

              </div>

  const renderStep = () => {

              <div className="form-control">    switch (currentStep) {

                <label className="label" htmlFor="apellidos">      case 1:

                  <span className="label-text font-medium">Apellidos *</span>        return (

                </label>          <div className="space-y-6">

                <input            <div className="text-center mb-6">

                  id="apellidos"              <h3 className="text-xl font-semibold">Información Personal</h3>

                  type="text"              <p className="text-sm text-base-content/60 mt-2">Complete los datos básicos de la persona</p>

                  name="apellidos"            </div>

                  placeholder="García López"            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  className="input input-bordered w-full"              <div className="form-control">

                  value={formData.apellidos}                <label className="label" htmlFor="numero_identidad">

                  onChange={handleInputChange}                  <span className="label-text font-medium">Número de Identidad *</span>

                />                </label>

              </div>                <input

                  id="numero_identidad"

              <div className="form-control">                  type="text"

                <label className="label" htmlFor="fecha_nacimiento">                  name="numero_identidad"

                  <span className="label-text font-medium">Fecha de Nacimiento *</span>                  placeholder="0801-1990-12345"

                </label>                  className="input input-bordered w-full"

                <input                  value={formData.numero_identidad}

                  id="fecha_nacimiento"                  onChange={handleInputChange}

                  type="date"                  maxLength={15}

                  name="fecha_nacimiento"                />

                  className="input input-bordered w-full"                <div className="label">

                  value={formData.fecha_nacimiento}                  <span className="label-text-alt text-xs">Formato: 0000-0000-00000</span>

                  onChange={handleInputChange}                </div>

                />              </div>

              </div>

              <div className="form-control">

              <div className="form-control">                <label className="label" htmlFor="genero">

                <label className="label" htmlFor="estado_civil">                  <span className="label-text font-medium">Género *</span>

                  <span className="label-text font-medium">Estado Civil</span>                </label>

                </label>                <select

                <select                  id="genero"

                  id="estado_civil"                  name="genero"

                  name="estado_civil"                  className="select select-bordered w-full"

                  className="select select-bordered w-full"                  value={formData.genero}

                  value={formData.estado_civil}                  onChange={handleInputChange}

                  onChange={handleInputChange}                >

                >                  <option value="" disabled>Seleccione...</option>

                  <option value="" disabled>Seleccione...</option>                  <option value="Masculino">Masculino</option>

                  <option value="Soltero">Soltero</option>                  <option value="Femenino">Femenino</option>

                  <option value="Casado">Casado</option>                </select>

                  <option value="Divorciado">Divorciado</option>              </div>

                  <option value="Viudo">Viudo</option>

                  <option value="Unión libre">Unión libre</option>              <div className="form-control">

                </select>                <label className="label" htmlFor="nombres">

              </div>                  <span className="label-text font-medium">Nombres *</span>

            </div>                </label>

          </div>                <input

        );                  id="nombres"

                  type="text"

      case 2:                  name="nombres"

        return (                  placeholder="Juan Carlos"

          <div className="space-y-6">                  className="input input-bordered w-full"

            <div className="text-center mb-6">                  value={formData.nombres}

              <h3 className="text-xl font-semibold">Ubicación</h3>                  onChange={handleInputChange}

              <p className="text-sm text-base-content/60 mt-2">Seleccione la ubicación geográfica</p>                />

            </div>              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="form-control">              <div className="form-control">

                <label className="label" htmlFor="departamento_id">                <label className="label" htmlFor="apellidos">

                  <span className="label-text font-medium">Departamento *</span>                  <span className="label-text font-medium">Apellidos *</span>

                </label>                </label>

                <select                <input

                  id="departamento_id"                  id="apellidos"

                  name="departamento_id"                  type="text"

                  className="select select-bordered w-full"                  name="apellidos"

                  value={formData.departamento_id || ''}                  placeholder="García López"

                  onChange={handleInputChange}                  className="input input-bordered w-full"

                >                  value={formData.apellidos}

                  <option value="">Seleccione departamento...</option>                  onChange={handleInputChange}

                  {departamentos.map((dept) => (                />

                    <option key={dept.id} value={dept.id}>              </div>

                      {dept.nombre_departamento}

                    </option>              <div className="form-control">

                  ))}                <label className="label" htmlFor="fecha_nacimiento">

                </select>                  <span className="label-text font-medium">Fecha de Nacimiento *</span>

              </div>                </label>

                <input

              <div className="form-control">                  id="fecha_nacimiento"

                <label className="label" htmlFor="municipio_id">                  type="date"

                  <span className="label-text font-medium">Municipio *</span>                  name="fecha_nacimiento"

                </label>                  className="input input-bordered w-full"

                <select                  value={formData.fecha_nacimiento}

                  id="municipio_id"                  onChange={handleInputChange}

                  name="municipio_id"                />

                  className="select select-bordered w-full"              </div>

                  value={formData.municipio_id || ''}

                  onChange={handleInputChange}              <div className="form-control">

                  disabled={!formData.departamento_id}                <label className="label" htmlFor="estado_civil">

                >                  <span className="label-text font-medium">Estado Civil</span>

                  <option value="">                </label>

                    {!formData.departamento_id ? 'Primero seleccione departamento' : 'Seleccione municipio...'}                <select

                  </option>                  id="estado_civil"

                  {municipios.map((mun) => (                  name="estado_civil"

                    <option key={mun.id} value={mun.id}>                  className="select select-bordered w-full"

                      {mun.nombre_municipio}                  value={formData.estado_civil}

                    </option>                  onChange={handleInputChange}

                  ))}                >

                </select>                  <option value="" disabled>Seleccione...</option>

              </div>                  <option value="Soltero">Soltero</option>

                  <option value="Casado">Casado</option>

              <div className="form-control md:col-span-2">                  <option value="Divorciado">Divorciado</option>

                <label className="label" htmlFor="sector_id">                  <option value="Viudo">Viudo</option>

                  <span className="label-text font-medium">Sector Parroquial</span>                  <option value="Union Libre">Unión Libre</option>

                </label>                </select>

                <select              </div>

                  id="sector_id"            </div>

                  name="sector_id"          </div>

                  className="select select-bordered w-full"        );

                  value={formData.sector_id || ''}

                  onChange={handleInputChange}      case 2:

                >        return (

                  <option value="">Seleccione sector...</option>          <div className="space-y-6">

                  {sectores.map((sector) => (            <div className="text-center mb-6">

                    <option key={sector.id} value={sector.id}>              <h3 className="text-xl font-semibold">Ubicación</h3>

                      {sector.nombre}              <p className="text-sm text-base-content/60 mt-2">Seleccione la ubicación geográfica</p>

                    </option>              {/* Debug info */}

                  ))}              <div className="text-xs text-gray-500 mt-2">

                </select>                Departamentos: {departamentos.length} | 

              </div>                Municipios: {municipios.length} | 

            </div>                Sectores: {sectores.length} |<br/>

          </div>                Selected Dept: {formData.departamento_id} |

        );                Selected Mun: {formData.municipio_id} |

                Selected Sec: {formData.sector_id}

      case 3:              </div>

        return (            </div>

          <div className="space-y-6">            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="text-center mb-6">              <div className="form-control">

              <h3 className="text-xl font-semibold">Información de Contacto</h3>                <label className="label" htmlFor="departamento_id">

              <p className="text-sm text-base-content/60 mt-2">Datos para comunicarse con la persona</p>                  <span className="label-text font-medium">Departamento *</span>

            </div>                </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                <select

              <div className="form-control">                  id="departamento_id"

                <label className="label" htmlFor="telefono">                  name="departamento_id"

                  <span className="label-text font-medium">Teléfono *</span>                  className="select select-bordered w-full"

                </label>                  value={formData.departamento_id || ''}

                <input                  onChange={handleInputChange}

                  id="telefono"                >

                  type="tel"                  <option value="">Seleccione...</option>

                  name="telefono"                  {departamentos.length > 0 ? (

                  placeholder="98765432"                    departamentos.map((dept, index) => (

                  className="input input-bordered w-full"                      <option key={`dept-${dept.codigo_departamento || index}`} value={dept.codigo_departamento}>

                  value={formData.telefono}                        {dept.nombre_departamento || 'Departamento sin nombre'}

                  onChange={handleInputChange}                      </option>

                  maxLength={8}                    ))

                />                  ) : (

              </div>                    <option disabled>Cargando departamentos...</option>

                  )}

              <div className="form-control">                </select>

                <label className="label" htmlFor="email">              </div>

                  <span className="label-text font-medium">Correo Electrónico</span>

                </label>              <div className="form-control">

                <input                <label className="label" htmlFor="municipio_id">

                  id="email"                  <span className="label-text font-medium">Municipio *</span>

                  type="email"                </label>

                  name="email"                <select

                  placeholder="correo@ejemplo.com"                  id="municipio_id"

                  className="input input-bordered w-full"                  name="municipio_id"

                  value={formData.email}                  className="select select-bordered w-full"

                  onChange={handleInputChange}                  value={formData.municipio_id || ''}

                />                  onChange={handleInputChange}

              </div>                  disabled={!formData.departamento_id}

                >

              <div className="form-control md:col-span-2">                  <option value="">Seleccione...</option>

                <label className="label" htmlFor="direccion">                  {municipios.map((mun, index) => (

                  <span className="label-text font-medium">Dirección</span>                    <option key={`mun-${mun.codigo_municipio || index}`} value={mun.codigo_municipio}>

                </label>                      {mun.nombre_municipio}

                <input                    </option>

                  id="direccion"                  ))}

                  type="text"                </select>

                  name="direccion"              </div>

                  placeholder="Colonia, barrio, calle, casa"

                  className="input input-bordered w-full"              <div className="form-control md:col-span-2">

                  value={formData.direccion}                <label className="label" htmlFor="sector_id">

                  onChange={handleInputChange}                  <span className="label-text font-medium">Sector Parroquial</span>

                />                </label>

              </div>                <select

            </div>                  id="sector_id"

          </div>                  name="sector_id"

        );                  className="select select-bordered w-full"

                  value={formData.sector_id || ''}

      case 4:                  onChange={handleInputChange}

        return (                >

          <div className="space-y-6">                  <option value="">Seleccione...</option>

            <div className="text-center mb-6">                  {sectores.map((sector, index) => (

              <h3 className="text-xl font-semibold">Información Sacramental</h3>                    <option key={`sector-${sector.id_sector_parroquial || index}`} value={sector.id_sector_parroquial?.toString()}>

              <p className="text-sm text-base-content/60 mt-2">Registros de sacramentos (opcional por ahora)</p>                      {sector.nombre}

            </div>                    </option>

            <div className="text-center text-base-content/60 py-12">                  ))}

              <p>Esta sección estará disponible próximamente.</p>                </select>

              <p className="text-sm mt-2">Por ahora puede continuar y completar los sacramentos posteriormente.</p>              </div>

            </div>            </div>

          </div>          </div>

        );        );



      default:      case 3:

        return null;        return (

    }          <div className="space-y-6">

  };            <div className="text-center mb-6">

              <h3 className="text-xl font-semibold">Información de Contacto</h3>

  return (              <p className="text-sm text-base-content/60 mt-2">Complete los datos de contacto</p>

    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>            </div>

      <div className="modal-box max-w-4xl max-h-[90vh] p-0">            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Header */}              <div className="form-control">

        <div className="flex items-center justify-between p-6 border-b border-base-300">                <label className="label" htmlFor="telefono">

          <h2 className="text-2xl font-bold">Nueva Persona</h2>                  <span className="label-text font-medium">Teléfono *</span>

          <button onClick={onClose} className="btn btn-sm btn-ghost btn-square">                </label>

            <XMarkIcon className="h-5 w-5" />                <input

          </button>                  id="telefono"

        </div>                  type="tel"

                  name="telefono"

        {/* Step indicator */}                  placeholder="9876-5432"

        <div className="px-6 py-4 bg-base-100">                  className="input input-bordered w-full"

          <div className="flex items-center justify-center space-x-4">                  value={formData.telefono}

            {steps.map((step) => (                  onChange={handleInputChange}

              <div key={step.id} className="flex items-center">                  maxLength={9}

                <div className={`                />

                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium                <div className="label">

                  ${currentStep >= step.id                   <span className="label-text-alt text-xs">Formato: 0000-0000</span>

                    ? 'bg-primary text-primary-content'                 </div>

                    : 'bg-base-300 text-base-content/60'              </div>

                  }

                `}>              <div className="form-control">

                  {step.id}                <label className="label" htmlFor="email">

                </div>                  <span className="label-text font-medium">Correo Electrónico</span>

                <div className="ml-2 hidden sm:block">                </label>

                  <p className={`text-sm font-medium ${                <input

                    currentStep >= step.id ? 'text-primary' : 'text-base-content/60'                  id="email"

                  }`}>                  type="email"

                    {step.title}                  name="email"

                  </p>                  placeholder="juan.garcia@ejemplo.com"

                </div>                  className="input input-bordered w-full"

                {step.id < steps.length && (                  value={formData.email}

                  <div className={`hidden sm:block w-12 h-0.5 ml-4 ${                  onChange={handleInputChange}

                    currentStep > step.id ? 'bg-primary' : 'bg-base-300'                />

                  }`} />              </div>

                )}

              </div>              <div className="form-control md:col-span-2">

            ))}                <label className="label" htmlFor="direccion">

          </div>                  <span className="label-text font-medium">Dirección Completa</span>

        </div>                </label>

                <input

        {/* Content */}                  id="direccion"

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>                  type="text"

          {renderStep()}                  name="direccion"

        </div>                  placeholder="Colonia, calle, número de casa"

                  className="input input-bordered w-full"

        {/* Footer */}                  value={formData.direccion}

        <div className="flex items-center justify-between p-6 border-t border-base-300">                  onChange={handleInputChange}

          <div className="flex items-center space-x-2">                />

            <button              </div>

              onClick={prevStep}            </div>

              className="btn btn-outline"          </div>

              disabled={currentStep === 1}        );

            >

              Anterior      default:

            </button>        return null;

                }

            {currentStep < 4 ? (  };

              <button

                onClick={nextStep}  return (

                className="btn btn-primary"    <div className="modal modal-open">

                disabled={!validateStep(currentStep)}      <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] p-0 relative">

              >        {/* Header */}

                Siguiente        <div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4">

              </button>          <div className="flex justify-between items-center mb-4">

            ) : (            <div className="flex-1">

              <button              <h2 className="text-2xl font-bold text-center">Nueva Persona</h2>

                onClick={handleSubmit}            </div>

                className="btn btn-primary"            <button

                disabled={!validateStep(3) || loading}              onClick={onClose}

              >              className="btn btn-ghost btn-sm btn-circle absolute top-4 right-4"

                {loading ? 'Guardando...' : 'Guardar Persona'}            >

              </button>              <XMarkIcon className="h-5 w-5" />

            )}            </button>

          </div>          </div>



          <div className="text-sm text-base-content/60">          {/* Steps */}

            Paso {currentStep} de {steps.length}          <div className="steps w-full">

          </div>            {steps.map((step, index) => {

        </div>              const isCompleted = currentStep > step.id;

      </div>              const isCurrent = currentStep === step.id;

    </div>              

  );              let stepClasses = 'step ';

}              if (isCompleted) {
                stepClasses += 'step-success';
              } else if (isCurrent) {
                stepClasses += 'step-primary';
              }

              return (
                <div key={`step-${step.id || index}`} className={stepClasses} data-content={isCompleted ? "✓" : step.id}>
                  <div className="text-xs font-medium">{step.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto" style={{ height: 'calc(90vh - 200px)' }}>
          <div className="max-w-3xl mx-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-base-100 border-t border-base-300 px-6 py-4">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn btn-outline min-w-[100px]"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-base-content/60 text-center">
                Paso {currentStep} de 3
              </div>
              <div className="w-32 bg-base-300 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="btn btn-primary min-w-[100px]"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(3) || loading}
                className="btn btn-success min-w-[100px]"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <button 
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
    </div>
  );
}
