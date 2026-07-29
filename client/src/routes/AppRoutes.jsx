import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Login from "../pages/auth/Login";
// Email verification before login temporarily disabled.
// import VerifyEmail from "../pages/auth/VerifyEmail";

import NotFound from "../pages/errors/NotFound";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import OwnerDashboard from "../pages/owner/OwnerDashboard";
import MyPets from "../pages/owner/pets/MyPets";
import AddPet from "../pages/owner/pets/AddPet";
import PetDetails from "../pages/owner/pets/PetDetails";
import Veterinarians from "../pages/owner/veterinarians/Veterinarians";
import VetDetails from "../pages/owner/veterinarians/VetDetails";
import MyAppointments from "../pages/owner/appointments/MyAppointments";
import BookAppointment from "../pages/owner/appointments/BookAppointment";
import AppointmentDetails from "../pages/owner/appointments/AppointmentDetails";
import HealthRecords from "../pages/owner/health/HealthRecords";
import Vaccinations from "../pages/owner/vaccinations/Vaccinations";
import AddVaccination from "../pages/owner/vaccinations/AddVaccination";
import EditVaccination from "../pages/owner/vaccinations/EditVaccination";
import GroomingBookings from "../pages/owner/grooming/GroomingBookings";
import BookGrooming from "../pages/owner/grooming/BookGrooming";
import GroomingDetails from "../pages/owner/grooming/GroomingDetails";
import Shop from "../pages/owner/shop/Shop";
import ProductDetails from "../pages/owner/shop/ProductDetails";
import Wishlist from "../pages/owner/shop/Wishlist";
import Cart from "../pages/owner/shop/Cart";
import Checkout from "../pages/owner/shop/Checkout";
import Orders from "../pages/owner/shop/Orders";
import OrderDetails from "../pages/owner/shop/OrderDetails";
import OwnerProfile from "../pages/owner/account/OwnerProfile";
import EditProfile from "../pages/owner/account/EditProfile";
import ChangePassword from "../pages/owner/account/ChangePassword";
import Settings from "../pages/owner/account/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected owner routes */}
      <Route element={<ProtectedRoute allowedRole="owner" />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="pets" element={<MyPets />} />
          <Route path="pets/add" element={<AddPet />} />
          <Route path="pets/:id" element={<PetDetails />} />
          <Route path="veterinarians" element={<Veterinarians />} />
          <Route path="veterinarians/:id" element={<VetDetails />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="appointments/book" element={<BookAppointment />} />
          <Route path="appointments/:id" element={<AppointmentDetails />} />
          <Route path="health-records" element={<HealthRecords />} />
          <Route path="vaccinations" element={<Vaccinations />} />
          <Route path="vaccinations/add" element={<AddVaccination />} />
          <Route path="vaccinations/:id/edit" element={<EditVaccination />} />
          <Route path="grooming" element={<GroomingBookings />} />
          <Route path="grooming/book" element={<BookGrooming />} />
          <Route path="grooming/:id" element={<GroomingDetails />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop/wishlist" element={<Wishlist />} />
          <Route path="shop/:id" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="profile" element={<OwnerProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 404 must remain last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
