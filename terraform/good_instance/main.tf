resource "google_compute_network" "custom_network" {
  name = "custom-network"
}

resource "google_compute_instance" "app1_instance_good" {
  name         = "app1_instance_bad"
  machine_type = "e2-medium"
  zone         = "asia-east1-a"
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network = google_compute_network.custom_network.id
  }

  metadata = {
    foo = "bar"
  }

  metadata_startup_script = "echo hi > /test.txt"

}