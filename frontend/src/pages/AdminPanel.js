import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LigaSelector from '../components/LigaSelector';
import { useAccess } from '../contexts/AccessContext';
import { useLiga } from '../contexts/LigaContext';
import {
  authAPI,
  estadisticasAPI,
  partidosAPI,
  extractApiErrorMessage,
} from '../services/api';
import './AdminPanel.css';

const CANCHAS_LIGUILLA = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];

const AdminPanel = () => {
  const {
    user,
    role,
    isAdmin,
    login,
    error: authError,
    setError: setAuthError,
  } = useAccess();
  const { temporadaActual } = useLiga();
  const isSilla = role === 'silla';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [liguillaLoading, setLiguillaLoading] = useState(false);
  const [liguillaMsg, setLiguillaMsg] = useState('');
  const [liguillaErr, setLiguillaErr] = useState('');
  const [liguillaFechaBase, setLiguillaFechaBase] = useState('');
  const [liguillaCanchaBase, setLiguillaCanchaBase] = useState('Cancha 1');
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [newUserActivo, setNewUserActivo] = useState(true);
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserErr, setNewUserErr] = useState('');
  const [newUserMsg, setNewUserMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersErr, setUsersErr] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fechaSugerida = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(19, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const okLogin = await login(username, password);
    if (!okLogin) return;
    setUsername('');
    setPassword('');
  };

  const iniciarLiguillaTop8 = async () => {
    if (!temporadaActual?.id) {
      setLiguillaErr('Selecciona primero una temporada activa.');
      return;
    }

    setLiguillaLoading(true);
    setLiguillaErr('');
    setLiguillaMsg('');

    try {
      const [{ data: tabla }, { data: partidos }] = await Promise.all([
        estadisticasAPI.tabla(temporadaActual.id),
        partidosAPI.getByTemporada(temporadaActual.id),
      ]);

      if (!Array.isArray(tabla) || tabla.length < 8) {
        setLiguillaErr('Se requieren al menos 8 equipos para iniciar liguilla.');
        return;
      }

      const top8 = tabla.slice(0, 8);
      const cruces = [
        [top8[0], top8[7]],
        [top8[1], top8[6]],
        [top8[2], top8[5]],
        [top8[3], top8[4]],
      ];

      const maxJornada = Array.isArray(partidos)
        ? partidos.reduce((max, p) => Math.max(max, Number(p?.jornada) || 0), 0)
        : 0;
      const jornadaLiguilla = maxJornada + 1;

      const fechaBase = new Date(liguillaFechaBase || fechaSugerida);
      if (Number.isNaN(fechaBase.getTime())) {
        setLiguillaErr('Fecha de inicio no valida para liguilla.');
        return;
      }

      const canchaIndexBase = Math.max(
        0,
        CANCHAS_LIGUILLA.findIndex((c) => c === liguillaCanchaBase),
      );

      for (let i = 0; i < cruces.length; i += 1) {
        const [local, visita] = cruces[i];
        const fechaMatch = new Date(fechaBase);
        fechaMatch.setHours(fechaBase.getHours() + i * 2);

        const cancha =
          CANCHAS_LIGUILLA[(canchaIndexBase + i) % CANCHAS_LIGUILLA.length];

        await partidosAPI.create({
          temporadaId: temporadaActual.id,
          equipoLocalId: Number(local.equipoId),
          equipoVisitaId: Number(visita.equipoId),
          jornada: jornadaLiguilla,
          fecha: fechaMatch.toISOString(),
          cancha,
        });
      }

      setLiguillaMsg(
        `Liguilla iniciada. Se crearon 4 partidos de cuartos en Jornada ${jornadaLiguilla}.`,
      );
    } catch (err) {
      setLiguillaErr(
        `No fue posible iniciar liguilla: ${extractApiErrorMessage(err)}`,
      );
    } finally {
      setLiguillaLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNewUserErr('');
    setNewUserMsg('');

    try {
      setNewUserLoading(true);
      const payload = {
        nombre: newUserNombre.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword,
        role: newUserRole,
        activo: newUserActivo,
      };

      const response = await authAPI.createUser(payload);
      const created = response.data;
      setNewUserMsg(
        `Usuario creado: ${created.nombre} (${created.role})`,
      );
      await loadUsers();
      setNewUserNombre('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('admin');
      setNewUserActivo(true);
    } catch (err) {
      setNewUserErr(`No fue posible crear usuario: ${extractApiErrorMessage(err)}`);
    } finally {
      setNewUserLoading(false);
    }
  };

  const loadUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    setUsersLoading(true);
    setUsersErr('');
    try {
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      setUsersErr(`No fue posible cargar usuarios: ${extractApiErrorMessage(err)}`);
    } finally {
      setUsersLoading(false);
    }
  }, [isSuperAdmin]);

  const handleDeleteUser = async (targetUser) => {
    const confirmed = window.confirm(
      `Se eliminara el usuario "${targetUser.nombre}" (${targetUser.email}). Esta accion no se puede deshacer.`,
    );
    if (!confirmed) return;

    setUsersErr('');
    setNewUserMsg('');
    try {
      setDeletingUserId(targetUser.id);
      await authAPI.deleteUser(targetUser.id);
      await loadUsers();
    } catch (err) {
      setUsersErr(`No fue posible eliminar usuario: ${extractApiErrorMessage(err)}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin, loadUsers]);

  if (!isAdmin && !isSilla) {
    return (
      <div className="admin-panel-container admin-login-wrap">
        <div className="admin-login-card">
          <h2>Administracion</h2>
          <p className="admin-login-subtitle">Inicia sesion</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>Usuario</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary admin-login-submit">
              Iniciar sesion
            </button>
            {authError && <p className="error-message">{authError}</p>}
          </form>
        </div>
      </div>
    );
  }

  if (isSilla) {
    return (
      <div className="admin-panel-container">
        <header className="admin-panel-header">
          <h2>Panel de Administracion</h2>
          <p>Tu rol solo permite registrar y editar marcadores.</p>
          <span className="admin-role-badge">Sesion activa: {role}</span>
        </header>
        <section className="admin-warning-card">
          Usa el modulo de partidos para capturar resultados.
          <div style={{ marginTop: 12 }}>
            <Link className="btn-primary" to="/partidos">
              Ir a Partidos
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-panel-header">
        <h2>Panel de Administracion</h2>
        <p>Gestion centralizada de ligas, equipos y operacion deportiva.</p>
        {!!role && <span className="admin-role-badge">Sesion activa: {role}</span>}
      </header>

      <section className="admin-panel-toolbar">
        <LigaSelector />
      </section>

      {!temporadaActual && (
        <div className="admin-warning-card">
          Selecciona o crea una temporada para administrar modulos de operacion.
        </div>
      )}

      <section className="admin-modules-grid">
        <article className="admin-module-card">
          <h3>Gestion de Ligas</h3>
          <p>
            {isSuperAdmin
              ? 'Crea, edita y organiza ligas junto con sus temporadas desde el modulo dedicado.'
              : 'Consulta y elimina ligas desde el modulo dedicado.'}
          </p>
          <Link className="btn-primary" to="/temporadas">
            Ir a Ligas
          </Link>
        </article>

        <article className="admin-module-card">
          <h3>Gestion de Equipos</h3>
          <p>
            Administra altas, edicion y depuracion de equipos por temporada
            vigente.
          </p>
          <Link className="btn-secondary" to="/equipos">
            Ir a Equipos
          </Link>
        </article>

        <article className="admin-module-card">
          <h3>Partidos y Resultados</h3>
          <p>
            Programa jornadas, gestiona asistencia y captura resultados oficiales.
          </p>
          <Link className="btn-primary" to="/partidos">
            Ir a Partidos
          </Link>
        </article>
      </section>

      {isSuperAdmin && (
        <section className="admin-users-card">
          <h3>Alta de Usuarios</h3>
          <p>
            Crea usuarios nuevos con rol. La liga se asigna siempre en null.
          </p>

          <form className="admin-users-form" onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={newUserNombre}
                onChange={(e) => setNewUserNombre(e.target.value)}
                required
                maxLength={80}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="form-group">
              <label>Password temporal</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="admin">admin</option>
                <option value="silla">silla</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="VISITOR">VISITOR</option>
              </select>
            </div>
            <label className="admin-users-checkbox">
              <input
                type="checkbox"
                checked={newUserActivo}
                onChange={(e) => setNewUserActivo(e.target.checked)}
              />
              Usuario activo
            </label>
            <button type="submit" className="btn-primary" disabled={newUserLoading}>
              {newUserLoading ? 'Creando usuario...' : 'Crear usuario'}
            </button>
          </form>
          {newUserErr && <div className="error-message">{newUserErr}</div>}
          {newUserMsg && <div className="success-message">{newUserMsg}</div>}
        </section>
      )}

      {isSuperAdmin && (
        <section className="admin-users-list-card">
          <div className="admin-users-list-head">
            <h3>Usuarios Registrados</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={loadUsers}
              disabled={usersLoading}
            >
              {usersLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {usersErr && <div className="error-message">{usersErr}</div>}

          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Activo</th>
                  <th>Alta</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {!usersLoading && users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="admin-users-empty">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
                {users.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nombre}</td>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    <td>{row.activo ? 'Si' : 'No'}</td>
                    <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-danger-soft"
                        onClick={() => handleDeleteUser(row)}
                        disabled={deletingUserId === row.id || Number(row.id) === Number(user?.id)}
                        title={
                          Number(row.id) === Number(user?.id)
                            ? 'No puedes eliminar tu propio usuario'
                            : 'Eliminar usuario'
                        }
                      >
                        {deletingUserId === row.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="admin-playoff-card">
        <h3>Iniciar Liguilla (Top 8)</h3>
        <p>
          Genera automaticamente cuartos de final con cruces 1vs8, 2vs7, 3vs6 y
          4vs5 usando la tabla actual.
        </p>

        <div className="admin-playoff-form">
          <div className="form-group">
            <label>Inicio de partidos</label>
            <input
              type="datetime-local"
              value={liguillaFechaBase}
              onChange={(e) => setLiguillaFechaBase(e.target.value)}
              placeholder={fechaSugerida}
            />
          </div>
          <div className="form-group">
            <label>Cancha inicial</label>
            <select
              value={liguillaCanchaBase}
              onChange={(e) => setLiguillaCanchaBase(e.target.value)}
            >
              {CANCHAS_LIGUILLA.map((cancha) => (
                <option key={cancha} value={cancha}>
                  {cancha}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={iniciarLiguillaTop8}
            disabled={!temporadaActual || liguillaLoading}
          >
            {liguillaLoading ? 'Creando cruces...' : 'Comenzar liguilla'}
          </button>
        </div>

        {liguillaErr && <div className="error-message">{liguillaErr}</div>}
        {liguillaMsg && <div className="success-message">{liguillaMsg}</div>}
      </section>
    </div>
  );
};

export default AdminPanel;
