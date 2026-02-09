import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Product {
  id: number;
  title: string;
  description: string;
  images: string[];
  rent_price?: number;
  buy_price?: number;
  stock_quantity: number;
  listing_type: 'rent' | 'sale' | 'both';
  owner: {
    id: number;
    name: string;
    avatar: string;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
  };
  related_products: any[];
}

export const ProductView: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/controllers/products.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProduct(data.data);
      });
  }, [id]);

  const sendMessage = async () => {
    const response = await fetch('/api/controllers/messaging.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        receiver_id: product?.owner.id,
        product_id: product?.id,
        message
      })
    });
    
    if (response.ok) {
      setShowMessageModal(false);
      setMessage('');
      alert('Message sent!');
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-view">
      <div className="product-main">
        <div className="product-images">
          <img src={product.images[0]} alt={product.title} />
        </div>
        
        <div className="product-info">
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          
          <div className="pricing">
            {product.rent_price && <span>Rent: {product.rent_price} RWF/day</span>}
            {product.buy_price && <span>Buy: {product.buy_price} RWF</span>}
          </div>
          
          {product.stock_quantity > 0 ? (
            <span className="stock">In Stock: {product.stock_quantity}</span>
          ) : (
            <span className="out-of-stock">Out of Stock</span>
          )}
          
          <div className="seller-info">
            <img src={product.owner.avatar} alt={product.owner.name} />
            <div>
              <h3>{product.owner.name}</h3>
              {product.owner.isVerified && <span>✓ Verified</span>}
              <div>⭐ {product.owner.rating} ({product.owner.reviewCount} reviews)</div>
            </div>
          </div>
          
          <button onClick={() => setShowMessageModal(true)}>
            Contact Seller
          </button>
        </div>
      </div>
      
      {product.related_products?.length > 0 && (
        <div className="related-products">
          <h2>Related Products</h2>
          <div className="products-grid">
            {product.related_products.map(rel => (
              <div key={rel.id} className="product-card">
                <img src={rel.images[0]} alt={rel.title} />
                <h3>{rel.title}</h3>
                <p>{rel.buy_price || rel.rent_price} RWF</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showMessageModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Message Seller</h2>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={() => setShowMessageModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
