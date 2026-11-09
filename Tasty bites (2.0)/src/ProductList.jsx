// // src/components/ProductList.jsx
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function ProductList({ category }) {
//   const [products, setProducts] = useState([]);
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     axios.get(`http://localhost:8080/api/products/category/${category}`, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     .then(res => setProducts(res.data))
//     .catch(err => console.error("Error fetching products:", err));
//   }, [category]);

//   return (
//     <div>
//       <h2>{category} Items</h2>
//       <ul>
//         {products.map(prod => (
//           <li key={prod.id}>
//             <strong>{prod.name}</strong> - ₹{prod.price}
//             <br />
//             <img src={prod.image} alt={prod.name} width="100" />
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default ProductList;
