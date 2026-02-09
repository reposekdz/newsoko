import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../../services/api';

interface LocationSelectorProps {
  value?: {
    province_id?: number;
    district_id?: number;
    sector_id?: number;
  };
  onChange: (location: { province_id: number; district_id: number; sector_id: number }) => void;
  required?: boolean;
}

export function LocationSelector({ value, onChange, required = false }: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(value?.province_id);
  const [selectedDistrict, setSelectedDistrict] = useState<number | undefined>(value?.district_id);
  const [selectedSector, setSelectedSector] = useState<number | undefined>(value?.sector_id);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince);
    } else {
      setDistricts([]);
      setSectors([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      loadSectors(selectedDistrict);
    } else {
      setSectors([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedSector) {
      onChange({
        province_id: selectedProvince,
        district_id: selectedDistrict,
        sector_id: selectedSector
      });
    }
  }, [selectedProvince, selectedDistrict, selectedSector]);

  const loadProvinces = async () => {
    const result = await api.getProvinces();
    if (result.success) setProvinces(result.data);
  };

  const loadDistricts = async (provinceId: number) => {
    const result = await api.getDistricts(provinceId);
    if (result.success) setDistricts(result.data);
  };

  const loadSectors = async (districtId: number) => {
    const result = await api.getSectors(districtId);
    if (result.success) setSectors(result.data);
  };

  const handleProvinceChange = (value: string) => {
    const provinceId = parseInt(value);
    setSelectedProvince(provinceId);
    setSelectedDistrict(undefined);
    setSelectedSector(undefined);
  };

  const handleDistrictChange = (value: string) => {
    const districtId = parseInt(value);
    setSelectedDistrict(districtId);
    setSelectedSector(undefined);
  };

  const handleSectorChange = (value: string) => {
    setSelectedSector(parseInt(value));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Province {required && <span className="text-red-500">*</span>}</Label>
        <Select value={selectedProvince?.toString()} onValueChange={handleProvinceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id.toString()}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>District {required && <span className="text-red-500">*</span>}</Label>
        <Select 
          value={selectedDistrict?.toString()} 
          onValueChange={handleDistrictChange}
          disabled={!selectedProvince}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedProvince ? "Select district" : "Select province first"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id.toString()}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Sector {required && <span className="text-red-500">*</span>}</Label>
        <Select 
          value={selectedSector?.toString()} 
          onValueChange={handleSectorChange}
          disabled={!selectedDistrict}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedDistrict ? "Select sector" : "Select district first"} />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((sector) => (
              <SelectItem key={sector.id} value={sector.id.toString()}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
