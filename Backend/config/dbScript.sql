-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-10-2025 a las 02:50:18
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `laboratorioavila`
--
CREATE DATABASE IF NOT EXISTS `laboratorioavila` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `laboratorioavila`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cita`
--

CREATE TABLE `cita` (
  `id_cita` int(11) NOT NULL,
  `id_paciente` int(11) DEFAULT NULL,
  `fecha_cita` datetime NOT NULL,
  `hora_cita` datetime NOT NULL,
  `observaciones` varchar(255) DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cita`
--

INSERT INTO `cita` (`id_cita`, `id_paciente`, `fecha_cita`, `hora_cita`, `observaciones`, `estado`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-10-13 00:00:00', '2025-10-13 15:30:00', '', '2', '2025-10-13 14:36:49', '2025-10-13 16:19:16'),
(2, 3, '2025-10-13 00:00:00', '2025-10-13 16:00:00', NULL, '1', '2025-10-13 15:09:03', '2025-10-13 15:09:03'),
(3, 4, '2025-10-13 00:00:00', '2025-10-13 16:30:00', NULL, '1', '2025-10-13 15:14:54', '2025-10-13 15:14:54'),
(4, 5, '2025-10-13 00:00:00', '2025-10-13 17:00:00', NULL, '0', '2025-10-13 15:33:54', '2025-10-13 16:19:41'),
(5, 5, '2025-10-14 00:00:00', '2025-10-14 09:00:00', 'Examen de Glucosa', '1', '2025-10-13 16:46:59', '2025-10-13 16:46:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comprobante`
--

CREATE TABLE `comprobante` (
  `id_comprobante` int(11) NOT NULL,
  `id_paciente` int(11) DEFAULT NULL,
  `fecha_emision` datetime NOT NULL,
  `total` double NOT NULL,
  `tipo_pago` char(1) DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_comprobante`
--

CREATE TABLE `detalle_comprobante` (
  `id_detalle_comprobante` int(11) NOT NULL,
  `id_comprobante` int(11) NOT NULL,
  `id_examen_realizado` int(11) DEFAULT NULL,
  `concepto_pago` varchar(50) DEFAULT NULL,
  `total` double DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `examen`
--

CREATE TABLE `examen` (
  `id_examen` int(11) NOT NULL,
  `titulo_examen` varchar(100) NOT NULL,
  `precio` double NOT NULL,
  `descripcion` varchar(50) DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `examen_insumo`
--

CREATE TABLE `examen_insumo` (
  `id_examen_insumo` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `id_examen` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `examen_realizado`
--

CREATE TABLE `examen_realizado` (
  `id_examen_realizado` int(11) NOT NULL,
  `id_paciente` int(11) DEFAULT NULL,
  `id_examen` int(11) DEFAULT NULL,
  `diagnostico` varchar(255) DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `insumo`
--

CREATE TABLE `insumo` (
  `id_insumo` int(11) NOT NULL,
  `nombre_insumo` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `stock_minimo` int(11) NOT NULL,
  `unidad_medida` varchar(10) DEFAULT NULL,
  `fecha_vencimiento` datetime DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `insumo`
--

INSERT INTO `insumo` (`id_insumo`, `nombre_insumo`, `descripcion`, `stock`, `stock_minimo`, `unidad_medida`, `fecha_vencimiento`, `estado`, `created_at`, `updated_at`) VALUES
(1, 'Curitas', 'Muy comodas', 10, 5, 'cantidad', '2025-12-12 00:00:00', '1', '2025-09-28 18:25:03', '2025-10-13 18:03:45'),
(2, 'Gasa', 'Algodon chino', 1, 1, 'cantidad', '2025-10-21 00:00:00', '1', '2025-10-03 19:28:51', '2025-10-13 17:57:39'),
(3, 'cvbcx', 'cvxbcxvb', 10, 6, 'cxbxcvb', '2026-10-10 00:00:00', '0', '2025-10-13 18:12:02', '2025-10-13 18:12:09'),
(4, 'sdfgsdf', 'dfsgdfg', 15, 6, 'fjdvdfv', '2025-12-10 00:00:00', '0', '2025-10-13 18:12:28', '2025-10-13 18:12:41'),
(5, 'Jabon Yodado', 'Botes de 100 ml', 10, 2, 'Cantidad', '2026-02-10 00:00:00', '0', '2025-10-13 18:19:32', '2025-10-13 18:23:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento_insumo`
--

CREATE TABLE `movimiento_insumo` (
  `id_movimiento_insumo` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `tipo_movimiento` char(1) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimiento_insumo`
--

INSERT INTO `movimiento_insumo` (`id_movimiento_insumo`, `id_insumo`, `tipo_movimiento`, `cantidad`, `observacion`, `estado`, `created_at`, `updated_at`) VALUES
(1, 1, 'E', 10, 'Ingreso inicial', '1', '2025-09-28 18:25:03', '2025-09-28 18:25:03'),
(2, 1, 'E', 6, 'Muchos pacientes', '1', '2025-09-28 18:37:36', '2025-09-28 18:37:36'),
(3, 1, 'S', 13, 'Muchos pacientes', '1', '2025-09-28 18:37:57', '2025-09-28 18:37:57'),
(4, 1, 'S', 3, 'fwsd', '1', '2025-09-28 18:38:30', '2025-09-28 18:38:30'),
(5, 2, 'E', 20, 'Ingreso inicial', '1', '2025-10-03 19:28:51', '2025-10-03 19:28:51'),
(6, 2, 'E', 10, 'Mas stock', '1', '2025-10-03 19:29:49', '2025-10-03 19:29:49'),
(7, 2, 'S', 15, 'Uso del dia', '1', '2025-10-03 19:30:23', '2025-10-03 19:30:23'),
(8, 2, 'S', 13, 'Uso del dia', '1', '2025-10-03 19:35:34', '2025-10-03 19:35:34'),
(9, 2, 'S', 1, 'Uso del dia', '1', '2025-10-03 19:37:07', '2025-10-03 19:37:07'),
(10, 1, 'E', 10, '', '1', '2025-10-13 17:56:55', '2025-10-13 17:56:55'),
(11, 3, 'E', 10, 'Ingreso inicial', '1', '2025-10-13 18:12:03', '2025-10-13 18:12:03'),
(12, 4, 'E', 10, 'Ingreso inicial', '1', '2025-10-13 18:12:28', '2025-10-13 18:12:28'),
(13, 4, 'E', 5, 'asff', '1', '2025-10-13 18:12:37', '2025-10-13 18:12:37'),
(14, 5, 'E', 10, 'Ingreso inicial', '1', '2025-10-13 18:19:32', '2025-10-13 18:19:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id_paciente` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `sexo` char(1) NOT NULL,
  `fecha_nacimiento` datetime DEFAULT NULL,
  `edad` int(11) DEFAULT NULL,
  `dui` varchar(10) DEFAULT NULL,
  `telefono` varchar(9) NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `estado` char(1) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id_paciente`, `nombre`, `apellido`, `sexo`, `fecha_nacimiento`, `edad`, `dui`, `telefono`, `fecha_registro`, `estado`, `created_at`, `updated_at`) VALUES
(1, 'Maicol', 'Monge', 'M', '2004-05-24 00:00:00', NULL, '06696164-6', '6423-2052', '2025-10-03 19:26:15', '1', '2025-10-03 19:26:15', '2025-10-13 14:09:18'),
(3, 'Sofia', 'Montes', 'F', NULL, 21, NULL, '7895-4587', '2025-10-13 15:09:03', '1', '2025-10-13 15:09:03', '2025-10-13 15:09:03'),
(4, 'Felipe', 'Cruz', 'M', '2003-06-13 00:00:00', NULL, NULL, '6555-3594', '2025-10-13 15:14:54', '1', '2025-10-13 15:14:54', '2025-10-13 15:14:54'),
(5, 'Sky-Blue', 'Preaston', 'F', '2004-12-12 00:00:00', NULL, NULL, '6884-9116', '2025-10-13 15:33:54', '1', '2025-10-13 15:33:54', '2025-10-13 17:15:54'),
(6, 'Hola2', 'Hola22', 'F', '2007-05-18 00:00:00', NULL, '51981989-2', '7898-4919', '2025-10-13 16:54:23', '0', '2025-10-13 16:54:23', '2025-10-13 17:13:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` char(1) NOT NULL,
  `estado` char(1) NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `requiere_cambio_password` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `nombre`, `apellido`, `nombre_usuario`, `password`, `rol`, `estado`, `correo`, `requiere_cambio_password`, `created_at`, `updated_at`) VALUES
(1, 'Administrador', 'Ávila', 'admin', '$2b$10$O2fBANC9zdlNbGQG5CrYw.dzWvOzzMLvru4ZjAbDlen5/WwIUt2w2', '0', '1', 'maicol.monge@catolica.edu.sv', 0, '2025-09-21 11:30:07', '2025-10-13 18:39:31');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cita`
--
ALTER TABLE `cita`
  ADD PRIMARY KEY (`id_cita`),
  ADD KEY `fk_cita_paciente` (`id_paciente`);

--
-- Indices de la tabla `comprobante`
--
ALTER TABLE `comprobante`
  ADD PRIMARY KEY (`id_comprobante`),
  ADD KEY `fk_comprobante_paciente` (`id_paciente`);

--
-- Indices de la tabla `detalle_comprobante`
--
ALTER TABLE `detalle_comprobante`
  ADD PRIMARY KEY (`id_detalle_comprobante`),
  ADD KEY `fk_detalle_comprobante_comprobante` (`id_comprobante`),
  ADD KEY `fk_detalle_comprobante_examen` (`id_examen_realizado`);

--
-- Indices de la tabla `examen`
--
ALTER TABLE `examen`
  ADD PRIMARY KEY (`id_examen`);

--
-- Indices de la tabla `examen_insumo`
--
ALTER TABLE `examen_insumo`
  ADD PRIMARY KEY (`id_examen_insumo`),
  ADD KEY `fk_examen_insumo_insumo` (`id_insumo`),
  ADD KEY `fk_examen_insumo_examen` (`id_examen`);

--
-- Indices de la tabla `examen_realizado`
--
ALTER TABLE `examen_realizado`
  ADD PRIMARY KEY (`id_examen_realizado`),
  ADD KEY `fk_examen_realizado_paciente` (`id_paciente`),
  ADD KEY `fk_examen_realizado_examen` (`id_examen`);

--
-- Indices de la tabla `insumo`
--
ALTER TABLE `insumo`
  ADD PRIMARY KEY (`id_insumo`);

--
-- Indices de la tabla `movimiento_insumo`
--
ALTER TABLE `movimiento_insumo`
  ADD PRIMARY KEY (`id_movimiento_insumo`),
  ADD KEY `fk_movimiento_insumo` (`id_insumo`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id_paciente`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cita`
--
ALTER TABLE `cita`
  MODIFY `id_cita` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `comprobante`
--
ALTER TABLE `comprobante`
  MODIFY `id_comprobante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_comprobante`
--
ALTER TABLE `detalle_comprobante`
  MODIFY `id_detalle_comprobante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `examen`
--
ALTER TABLE `examen`
  MODIFY `id_examen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `examen_insumo`
--
ALTER TABLE `examen_insumo`
  MODIFY `id_examen_insumo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `examen_realizado`
--
ALTER TABLE `examen_realizado`
  MODIFY `id_examen_realizado` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `insumo`
--
ALTER TABLE `insumo`
  MODIFY `id_insumo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `movimiento_insumo`
--
ALTER TABLE `movimiento_insumo`
  MODIFY `id_movimiento_insumo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id_paciente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cita`
--
ALTER TABLE `cita`
  ADD CONSTRAINT `fk_cita_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`);

--
-- Filtros para la tabla `comprobante`
--
ALTER TABLE `comprobante`
  ADD CONSTRAINT `fk_comprobante_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`);

--
-- Filtros para la tabla `detalle_comprobante`
--
ALTER TABLE `detalle_comprobante`
  ADD CONSTRAINT `fk_detalle_comprobante_comprobante` FOREIGN KEY (`id_comprobante`) REFERENCES `comprobante` (`id_comprobante`),
  ADD CONSTRAINT `fk_detalle_comprobante_examen_realizado` FOREIGN KEY (`id_examen_realizado`) REFERENCES `examen_realizado` (`id_examen_realizado`);

--
-- Filtros para la tabla `examen_insumo`
--
ALTER TABLE `examen_insumo`
  ADD CONSTRAINT `fk_examen_insumo_examen` FOREIGN KEY (`id_examen`) REFERENCES `examen` (`id_examen`),
  ADD CONSTRAINT `fk_examen_insumo_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`);

--
-- Filtros para la tabla `examen_realizado`
--
ALTER TABLE `examen_realizado`
  ADD CONSTRAINT `fk_examen_realizado_examen` FOREIGN KEY (`id_examen`) REFERENCES `examen` (`id_examen`),
  ADD CONSTRAINT `fk_examen_realizado_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `paciente` (`id_paciente`);

--
-- Filtros para la tabla `movimiento_insumo`
--
ALTER TABLE `movimiento_insumo`
  ADD CONSTRAINT `fk_movimiento_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo` (`id_insumo`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
