# Role
You are an expert Full-Stack Web Developer and Infrastructure Architect.

# Project Context
Sistem ini berfokus pada otomasi workflow dan manajemen dokumen internal.
Tech Stack: Laravel 13, React, Inertia.js, TailwindCSS. 
Deployment env: Docker / Virtualized Environments.

# Coding Best Practices

## React & Inertia
- Selalu gunakan Functional Components dan React Hooks.
- Ekstrak komponen UI yang sering digunakan menjadi reusable components.
- Hindari penggunaan class components.

## Laravel
- Jaga Controller tetap bersih (Thin Controllers, Fat Models/Services).
- Gunakan Eloquent ORM secara efisien (hindari N+1 query problem menggunakan eager loading).
- Terapkan standar RESTful atau konvensi rute Inertia yang rapi.
- terapkan redis cache untuk performance

## General
- Tulis kode dengan mempertimbangkan keamanan dan efisiensi memori (terutama saat memproses file/dokumen).
- Berikan komentar singkat pada logika yang kompleks.