import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Gavel, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import { auctionApi } from '../../../services/advancedApi';
import { toast } from 'sonner';

export function AuctionMarketplace() {
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [myBids, setMyBids] = useState([]);

  useEffect(() => {
    loadAuctions();
    loadMyBids();
    
    const interval = setInterval(() => {
      loadAuctions();
      if (selectedAuction) {
        loadAuctionDetails(selectedAuction.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadAuctions = async () => {
    try {
      const response = await auctionApi.getActiveAuctions();
      if (response.success) {
        setAuctions(response.data);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuctionDetails = async (auctionId) => {
    try {
      const response = await auctionApi.getAuctionDetails(auctionId);
      if (response.success) {
        setSelectedAuction(response.data);
      }
    } catch (error) {
      console.error('Error loading auction details:', error);
    }
  };

  const loadMyBids = async () => {
    try {
      const response = await auctionApi.getMyBids();
      if (response.success) {
        setMyBids(response.data);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || !selectedAuction) return;

    try {
      const response = await auctionApi.placeBid(selectedAuction.id, parseFloat(bidAmount));
      if (response.success) {
        toast.success('Bid placed successfully!');
        setBidAmount('');
        loadAuctionDetails(selectedAuction.id);
        loadAuctions();
        loadMyBids();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to place bid');
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel className="w-8 h-8" />
            Live Auctions
          </h1>
          <p className="text-muted-foreground">Bid on exclusive items and win great deals</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {auctions.length} Active Auctions
        </Badge>
      </div>

      {myBids.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Active Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myBids.slice(0, 3).map((bid) => (
                <div key={bid.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <img src={bid.images?.[0]} alt={bid.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{bid.title}</p>
                    <p className="text-sm text-muted-foreground">Your bid: {bid.bid_amount.toLocaleString()} RWF</p>
                    <Badge variant={bid.bid_status === 'winning' ? 'default' : 'secondary'} className="mt-1">
                      {bid.bid_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-8">Loading auctions...</div>
            ) : auctions.length === 0 ? (
              <div className="col-span-2 text-center py-8">
                <Gavel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No active auctions at the moment</p>
              </div>
            ) : (
              auctions.map((auction) => (
                <Card key={auction.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => loadAuctionDetails(auction.id)}>
                  <CardHeader className="p-0">
                    <img src={auction.images?.[0]} alt={auction.title} className="w-full h-48 object-cover rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{auction.title}</CardTitle>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Bid</span>
                        <span className="font-bold text-lg">{(auction.current_bid || auction.starting_price).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Time Left
                        </span>
                        <Badge variant={auction.time_remaining < 3600 ? 'destructive' : 'secondary'}>
                          {formatTimeRemaining(auction.time_remaining)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Bids
                        </span>
                        <span className="font-semibold">{auction.bid_count}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full">Place Bid</Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedAuction ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Auction Details</CardTitle>
                <CardDescription>{selectedAuction.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <img src={selectedAuction.images?.[0]} alt={selectedAuction.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Bid</p>
                    <p className="text-3xl font-bold">{(selectedAuction.current_bid || selectedAuction.starting_price).toLocaleString()} RWF</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedAuction.seller_avatar} />
                      <AvatarFallback>{selectedAuction.seller_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedAuction.seller_name}</p>
                      <p className="text-sm text-muted-foreground">Seller</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Starting Price</p>
                      <p className="font-semibold">{selectedAuction.starting_price.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bid Increment</p>
                      <p className="font-semibold">{selectedAuction.bid_increment.toLocaleString()} RWF</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Place Your Bid</p>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Enter bid amount" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                      <Button onClick={handlePlaceBid}>Bid</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum bid: {((selectedAuction.current_bid || selectedAuction.starting_price) + selectedAuction.bid_increment).toLocaleString()} RWF
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Bid History</p>
                    <ScrollArea className="h-48">
                      {selectedAuction.bid_history?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No bids yet</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedAuction.bid_history?.map((bid) => (
                            <div key={bid.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={bid.bidder_avatar} />
                                  <AvatarFallback>{bid.bidder_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{bid.bidder_name}</span>
                              </div>
                              <span className="font-semibold">{bid.bid_amount.toLocaleString()} RWF</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-4">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Gavel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an auction to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
