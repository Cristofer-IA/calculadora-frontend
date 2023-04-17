import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import '../../public/css/calculadora.css';
import Ume from './Ume';
import * as tf from '@tensorflow/tfjs';
import { HiMenu } from 'react-icons/hi';
import { CgClose } from 'react-icons/cg';

const Calculadora = () => {
  const ingredientes = useSelector(state => state.ingredientes);
  const { trainer } = useSelector(state => state);

  const [alimentoFilter, setAlimentoFilter] = useState();
  const [ingredienteSeleccionado, setIngredienteSeleccionado] = useState([]);
  const [mensaje, setMensaje] = useState();
  const [modeloRN, setModeloRN] = useState();
  const [modeloRL, setModeloRL] = useState();
  const [totalRN, setTotalRN] = useState();
  const [totalRL, setTotalRL] = useState();
  const [totalGA, setTotalGA] = useState();
  const [totalDatoEtiqueta, setTotalDatoEtiqueta] = useState();

  useEffect(() => {
    if (ingredientes) {
      setAlimentoFilter(ingredientes);
    }
  }, [ingredientes]);

  useEffect(() => {
    if (ingredienteSeleccionado.length === 0) {
      setMensaje('* Agregue ingredientes a esta receta');
    } else {
      setMensaje('');
    }

    totalCalorias();
  }, [ingredienteSeleccionado]);

  const handleChange = e => {
    const inputValue = e.target.value.toLowerCase().trim();
    const filter = ingredientes.filter(nombre =>
      nombre.alimento.toLowerCase().includes(inputValue)
    );
    setAlimentoFilter(filter);
  };

  const handleClic = ingrediente => {
    const temp = ingredienteSeleccionado.filter(
      item => item.id === ingrediente.id
    );
    if (temp.length > 0) {
      setMensaje('* El alimento seleccionado ya está en la lista');
    } else {
      const objtIngrediente = {
        id: ingrediente.id,
        alimento: ingrediente.alimento,
        racion: ingrediente.racion,
        ume: ingrediente.ume,
        carbohidratos: ingrediente.carbohidratos,
        grasas: ingrediente.grasas,
        proteinas: ingrediente.proteinas,
        fibra: ingrediente.fibra,
        alcohol: ingrediente.alcohol,
        calorias: ingrediente.calorias,
        cantidad: 0,
        caloriasRN: 0,
        caloriasRL: 0,
        caloriasGA: 0,
        caloriasDE: 0,
      };
      const nuevoArray = [...ingredienteSeleccionado];
      nuevoArray.push(objtIngrediente);
      setIngredienteSeleccionado(nuevoArray);
    }
  };

  const handleDelete = id => {
    const index = ingredienteSeleccionado.findIndex(item => {
      return item.id === id;
    });

    if (index !== -1) {
      const nuevoArray = [...ingredienteSeleccionado];
      nuevoArray.splice(index, 1);
      setIngredienteSeleccionado(nuevoArray);
    }
  };

  // Modelo de red neuronal con tensorflow
  const cargarModeloRN = async () => {
    console.log('Cargando RN modelo...');
    const model = await tf.loadLayersModel('./utils/RN/model.json');
    setModeloRN(model);
    console.log('Modelo RN cargado...');
  };

  // Modelo de regresión lineal con tensorflow
  const cargarModeloRL = async () => {
    console.log('Cargando modelo RL...');
    const model = await tf.loadLayersModel('./utils/RL/model.json');
    setModeloRL(model);
    console.log('Modelo RL cargado...');
  };

  useEffect(() => {
    cargarModeloRN();
    cargarModeloRL();
  }, []);

  const handleEdit = (e, id) => {
    let cantidad = 0;
    if (e.target.value) {
      cantidad = e.target.value;
    }
    const index = ingredienteSeleccionado.findIndex(item => {
      return item.id === id;
    });

    if (index !== -1) {
      ingredienteSeleccionado[index].cantidad = parseFloat(cantidad);
    }
    console.log(ingredienteSeleccionado[index].cantidad);
  };

  const calcularCalorias = () => {
    ingredienteSeleccionado.forEach((item, index, arr) => {
      const proteinas = item.proteinas * (item.cantidad / item.racion);
      const grasas = item.grasas * (item.cantidad / item.racion);
      const carbohidratos = item.carbohidratos * (item.cantidad / item.racion);
      const fibra = item.fibra * (item.cantidad / item.racion) * -1;
      const alcohol = item.alcohol * (item.cantidad / item.racion);

      const datoEtiqueta = item.calorias * (item.cantidad / item.racion);

      const tensor = tf.tensor2d([
        [grasas, carbohidratos, proteinas, alcohol, fibra],
      ]);

      const prediccionRN = modeloRN.predict(tensor);
      const prediccionRL = modeloRL.predict(tensor);
      const predicciónFormula =
        grasas * 9 +
        carbohidratos * 4 +
        proteinas * 4 +
        alcohol * 7 +
        fibra * -2;

      item.caloriasRN = prediccionRN.dataSync()[0].toFixed(2);
      item.caloriasRL = prediccionRL.dataSync()[0].toFixed(2);
      item.caloriasGA = predicciónFormula.toFixed(2);
      item.caloriasDE = datoEtiqueta.toFixed(2);
    });

    const newArr = [...ingredienteSeleccionado];
    setIngredienteSeleccionado(newArr);
    console.log(ingredienteSeleccionado);
  };

  const totalCalorias = () => {
    let totalRN = 0;
    let totalRL = 0;
    let totalGA = 0;
    let totalDE = 0;
    ingredienteSeleccionado.forEach(item => {
      totalRN += +item.caloriasRN;
      totalRL += +item.caloriasRL;
      totalGA += +item.caloriasGA;
      totalDE += +item.caloriasDE;
    });
    setTotalRN(totalRN.toFixed(2));
    setTotalRL(totalRL.toFixed(2));
    setTotalGA(totalGA.toFixed(2));
    setTotalDatoEtiqueta(totalDE.toFixed(2));
  };

  const handleAdd = () => {
    const alimento = document.querySelector('.alimentos');
    alimento.classList.add('mostrar__alimento');
  };
  const handleRemove = () => {
    const alimento = document.querySelector('.alimentos');
    alimento.classList.remove('mostrar__alimento');
  };

  return (
    <div className="calc">
      <div className="calc__container">
        <div className="calc__body">
          <div className="calc__titulo">
            <h3>Plato:</h3>
            <h1>{trainer}</h1>
          </div>
          <div className="calc__lista">
            <table className="table">
              <thead className="table__head">
                <tr>
                  <th>INGREDIENTES</th>
                  <th>CANTIDAD</th>
                  <th>UME</th>
                  <th>Red Neuronal</th>
                  <th>Regresión Lineal</th>
                  <th>General Atwater</th>
                  <th>Datos Etiqueta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="table__body">
                {ingredienteSeleccionado.map(item => (
                  <tr key={item.id}>
                    <td>{item.alimento}</td>
                    <td>
                      <input
                        onChange={e => {
                          handleEdit(e, item.id);
                        }}
                        type="number"
                        autoComplete="of"
                        placeholder={item.cantidad}
                      />
                    </td>
                    <td>{item.ume}</td>
                    <td>{item.caloriasRN} cal.</td>
                    <td>{item.caloriasRL} cal.</td>
                    <td>{item.caloriasGA} cal.</td>
                    <td>{item.caloriasDE} cal.</td>
                    <td>
                      <button
                        onClick={() => {
                          handleDelete(item.id);
                        }}
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mensaje">
              <p>{mensaje}</p>
            </div>
            <div className="total_caloria">
              <table className="table-total">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>TIPO</th>
                    <th>TOTAL CALORIAS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>R.N.</td>
                    <td>{totalRN}</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>R.L.</td>
                    <td>{totalRL}</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>G.A.</td>
                    <td>{totalGA}</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>D.E.</td>
                    <td>{totalDatoEtiqueta}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button onClick={calcularCalorias} id="btn_predecir">
              Predecir calorías
            </button>
            <br />
            <br />
            <br />
          </div>
        </div>
        <div className="alimentos">
          <div className="alimentos__opcion">
            <HiMenu className="btn__menu" onClick={handleAdd} />
            <CgClose className="btn__cerrar" onClick={handleRemove} />
          </div>
          <h3>Lista de ingredientes</h3>

          <input
            type="text"
            placeholder="Buscar"
            onChange={handleChange}
            autoComplete="of"
          />

          <div className="alimentos__lista">
            {alimentoFilter?.map(ingrediente => (
              <div key={ingrediente.id}>
                <p>{ingrediente.alimento}</p>
                <button
                  onClick={() => {
                    handleClic(ingrediente);
                  }}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="unida-de-medida">
        <Ume />
      </div>
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default Calculadora;
