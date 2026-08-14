import { Navigate, Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import PublicProducts from "../pages/public/Products";
import PublicCart from "../pages/public/PublicCart";
import ApplyVet from "../pages/public/ApplyVet";
import Login from "../pages/auth/Login";
// Email verification before login temporarily disabled.
// import VerifyEmail from "../pages/auth/VerifyEmail";

import NotFound from "../pages/errors/NotFound";
import Forbidden from "../pages/errors/Forbidden";
import Register from "../pages/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import OwnerDashboard from "../pages/owner/OwnerDashboard";
import MyPets from "../pages/owner/pets/MyPets";
import AddPet from "../pages/owner/pets/AddPet";
import PetDetails from "../pages/owner/pets/PetDetails";
import Veterinarians from "../pages/owner/veterinarians/Veterinarians";
import VetDetails from "../pages/owner/veterinarians/VetDetails";
import Groomers from "../pages/owner/groomers/Groomers";
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
import OwnerNotifications from "../pages/owner/notifications/OwnerNotifications";

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import VetLayout from "../layouts/VetLayout";
import VetDashboard from "../pages/vet/VetDashboard";
import VetAppointments from "../pages/vet/appointments/VetAppointments";
import VetAppointmentDetails from "../pages/vet/appointments/VetAppointmentDetails";
import VetPatients from "../pages/vet/patients/VetPatients";
import VetPatientDetails from "../pages/vet/patients/VetPatientDetails";
import VetPrescriptions from "../pages/vet/prescriptions/VetPrescriptions";
import VetAvailability from "../pages/vet/availability/VetAvailability";
import VetReviews from "../pages/vet/reviews/VetReviews";
import VetNotifications from "../pages/vet/notifications/VetNotifications";
import VetProfilePage from "../pages/vet/profile/VetProfile";
import VetChangePassword from "../pages/vet/profile/VetChangePassword";
import GroomerLayout from "../layouts/GroomerLayout";
import GroomerDashboard from "../pages/groomer/GroomerDashboard";
import GroomerBookings from "../pages/groomer/bookings/GroomerBookings";
import GroomerBookingDetails from "../pages/groomer/bookings/GroomerBookingDetails";
import GroomerCustomers from "../pages/groomer/customers/GroomerCustomers";
import GroomerCustomerDetails from "../pages/groomer/customers/GroomerCustomerDetails";
import GroomerPets from "../pages/groomer/pets/GroomerPets";
import GroomerPetDetails from "../pages/groomer/pets/GroomerPetDetails";
import GroomerSchedule from "../pages/groomer/schedule/GroomerSchedule";
import GroomerAvailability from "../pages/groomer/availability/GroomerAvailability";
import GroomerServices from "../pages/groomer/services/GroomerServices";
import GroomerEarnings from "../pages/groomer/earnings/GroomerEarnings";
import GroomerReviews from "../pages/groomer/reviews/GroomerReviews";
import GroomerNotifications from "../pages/groomer/notifications/GroomerNotifications";
import GroomerProfile from "../pages/groomer/profile/GroomerProfile";
import GroomerChangePassword from "../pages/groomer/profile/GroomerChangePassword";

import Users from "../pages/admin/users/Users";
import UserDetails from "../pages/admin/users/UserDetails";
import AdminPets from "../pages/admin/pets/Pets";
import AdminPetDetails from "../pages/admin/pets/PetDetails";

import ManageVets from "../pages/admin/veterinarians/ManageVets";
import AddVet from "../pages/admin/veterinarians/AddVet";
import AdminVetDetails from "../pages/admin/veterinarians/VetDetails";

import ManageGroomers from "../pages/admin/groomers/ManageGroomers";
import AddGroomer from "../pages/admin/groomers/AddGroomer";
import EditGroomer from "../pages/admin/groomers/EditGroomer";
import GroomerDetails from "../pages/admin/groomers/GroomerDetails";

import ManageAppointments from "../pages/admin/appointments/ManageAppointments";
import AdminAppointmentDetails from "../pages/admin/appointments/AppointmentDetails";

import Categories from "../pages/admin/categories/Categories";
import AddCategory from "../pages/admin/categories/AddCategory";
import EditCategory from "../pages/admin/categories/EditCategory";

import Products from "../pages/admin/products/Products";
import AddProduct from "../pages/admin/products/AddProduct";
import EditProduct from "../pages/admin/products/EditProduct";
import AdminProductDetails from "../pages/admin/products/ProductDetails";

import GroomingServices from "../pages/admin/grooming/GroomingServices";
import AddGroomingService from "../pages/admin/grooming/AddGroomingService";
import EditGroomingService from "../pages/admin/grooming/EditGroomingService";
import AdminGroomingBookings from "../pages/admin/groomingBookings/GroomingBookings";
import AdminGroomingBookingDetails from "../pages/admin/groomingBookings/GroomingBookingDetails";
import AdminOrders from "../pages/admin/orders/Orders";
import AdminOrderDetails from "../pages/admin/orders/OrderDetails";
import AdminPayments from "../pages/admin/payments/Payments";
import AdminNotifications from "../pages/admin/notifications/Notifications";
import SendNotification from "../pages/admin/notifications/SendNotification";
import AdminSettings from "../pages/admin/settings/AdminSettings";
import AdminVaccinations from "../pages/admin/vaccinations/Vaccinations";
import AdminReviews from "../pages/admin/reviews/Reviews";
import AdminComplaints from "../pages/admin/complaints/Complaints";
import AuditLogs from "../pages/admin/audit/AuditLogs";

import Reports from "../pages/admin/reports/Reports";
import AdminProfile from "../pages/admin/account/AdminProfile";
import EditAdminProfile from "../pages/admin/account/EditAdminProfile";
import AdminChangePassword from "../pages/admin/account/ChangePassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<PublicProducts />} />
        <Route path="/cart" element={<PublicCart />} />
      </Route>

      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/apply-vet" element={<ApplyVet />} />
      <Route path="/403" element={<Forbidden />} />

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
          <Route path="groomers" element={<Groomers />} />
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
          <Route path="notifications" element={<OwnerNotifications />} />
          <Route path="profile" element={<OwnerProfile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Protected veterinarian routes */}
      <Route element={<ProtectedRoute allowedRole="vet" />}>
        <Route path="/vet" element={<VetLayout />}>
          <Route index element={<Navigate to="/vet/dashboard" replace />} />
          <Route path="dashboard" element={<VetDashboard />} />
          <Route path="appointments" element={<VetAppointments />} />
          <Route path="appointments/:id" element={<VetAppointmentDetails />} />
          <Route path="patients" element={<VetPatients />} />
          <Route path="patients/:id" element={<VetPatientDetails />} />
          <Route path="prescriptions" element={<VetPrescriptions />} />
          <Route path="availability" element={<VetAvailability />} />
          <Route path="reviews" element={<VetReviews />} />
          <Route path="notifications" element={<VetNotifications />} />
          <Route path="profile" element={<VetProfilePage />} />
          <Route path="change-password" element={<VetChangePassword />} />
        </Route>
      </Route>

      {/* Protected groomer routes */}
      <Route element={<ProtectedRoute allowedRole="groomer" />}>
        <Route path="/groomer" element={<GroomerLayout />}>
          <Route index element={<Navigate to="/groomer/dashboard" replace />} />
          <Route path="dashboard" element={<GroomerDashboard />} />
          <Route path="bookings" element={<GroomerBookings />} />
          <Route path="bookings/:id" element={<GroomerBookingDetails />} />
          <Route path="schedule" element={<GroomerSchedule />} />
          <Route path="customers" element={<GroomerCustomers />} />
          <Route path="customers/:id" element={<GroomerCustomerDetails />} />
          <Route path="pets" element={<GroomerPets />} />
          <Route path="pets/:id" element={<GroomerPetDetails />} />
          <Route path="services" element={<GroomerServices />} />
          <Route path="availability" element={<GroomerAvailability />} />
          <Route path="earnings" element={<GroomerEarnings />} />
          <Route path="reviews" element={<GroomerReviews />} />
          <Route path="notifications" element={<GroomerNotifications />} />
          <Route path="profile" element={<GroomerProfile />} />
          <Route path="change-password" element={<GroomerChangePassword />} />
        </Route>
      </Route>

      {/* Protected admin routes */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Users */}
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />

          {/* Pets */}
          <Route path="pets" element={<AdminPets />} />
          <Route path="pets/:id" element={<AdminPetDetails />} />

          {/* Veterinarians */}
          <Route path="veterinarians" element={<ManageVets />} />
          <Route path="veterinarians/add" element={<AddVet />} />
          <Route
            path="veterinarians/:id"
            element={<AdminVetDetails />}
          />

          {/* Groomers */}
          <Route path="groomers" element={<ManageGroomers />} />
          <Route path="groomers/add" element={<AddGroomer />} />
          <Route path="groomers/:id/edit" element={<EditGroomer />} />
          <Route path="groomers/:id" element={<GroomerDetails />} />

          {/* Appointments */}
          <Route
            path="appointments"
            element={<ManageAppointments />}
          />
          <Route
            path="appointments/:id"
            element={<AdminAppointmentDetails />}
          />

          {/* Categories */}
          <Route path="categories" element={<Categories />} />
          <Route path="categories/add" element={<AddCategory />} />
          <Route
            path="categories/:id/edit"
            element={<EditCategory />}
          />

          {/* Products */}
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route
            path="products/:id"
            element={<AdminProductDetails />}
          />
          <Route
            path="products/:id/edit"
            element={<EditProduct />}
          />

          {/* Grooming services */}
          <Route
            path="grooming-services"
            element={<GroomingServices />}
          />
          <Route
            path="grooming-services/add"
            element={<AddGroomingService />}
          />
          <Route
            path="grooming-services/:id/edit"
            element={<EditGroomingService />}
          />

          {/* Grooming bookings */}
          <Route
            path="grooming-bookings"
            element={<AdminGroomingBookings />}
          />
          <Route
            path="grooming-bookings/:id"
            element={<AdminGroomingBookingDetails />}
          />

          {/* Orders */}
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetails />} />

          {/* Future modules */}
          <Route path="payments" element={<AdminPayments />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="notifications/create" element={<SendNotification />} />
          <Route path="vaccinations" element={<AdminVaccinations />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="audit-logs" element={<AuditLogs />} />

          {/* Reports */}
          <Route path="reports" element={<Reports />} />

          {/* Account */}
          <Route path="profile" element={<AdminProfile />} />
          <Route
            path="profile/edit"
            element={<EditAdminProfile />}
          />
          <Route
            path="change-password"
            element={<AdminChangePassword />}
          />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* 404 must remain last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
