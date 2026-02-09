import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

interface BookingCalendarProps {
  productId: number;
}

export function BookingCalendar({ productId }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailability();
  }, [productId, currentDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const result = await api.getProductAvailabilityCalendar(productId);
      if (result.success) {
        setBookings(result.bookings || []);
      }
    } catch (error) {
      toast({ title: 'Failed to load calendar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateBooked = (date: Date) => {
    return bookings.some(booking => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      return date >= start && date <= end;
    });
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => 
      d.getDate() === date.getDate() && 
      d.getMonth() === date.getMonth() && 
      d.getFullYear() === date.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateBooked(date)) return;

    if (isDateSelected(date)) {
      setSelectedDates(selectedDates.filter(d => 
        !(d.getDate() === date.getDate() && d.getMonth() === date.getMonth())
      ));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[150px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const isBooked = isDateBooked(date);
            const isSelected = isDateSelected(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={day}
                onClick={() => !isPast && handleDateClick(date)}
                disabled={isPast || isBooked}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-colors
                  ${isPast ? 'text-muted-foreground/30 cursor-not-allowed' : ''}
                  ${isBooked ? 'bg-red-500/20 text-red-600 cursor-not-allowed' : ''}
                  ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                  ${!isPast && !isBooked && !isSelected ? 'hover:bg-secondary' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 rounded" />
            <span>Available</span>
          </div>
        </div>

        {selectedDates.length > 0 && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="font-semibold mb-2">Selected Dates:</p>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, i) => (
                <Badge key={i}>{date.toLocaleDateString()}</Badge>
              ))}
            </div>
            <Button className="w-full mt-3">Book Selected Dates</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
